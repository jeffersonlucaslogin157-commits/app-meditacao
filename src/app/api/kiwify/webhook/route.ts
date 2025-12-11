import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Token de validação da Kiwify
const KIWIFY_WEBHOOK_TOKEN = '2mdy0e060tb';

// Criar cliente Supabase para uso no servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Tipos de eventos da Kiwify
type KiwifyEventType = 
  | 'order.paid'
  | 'order.refused'
  | 'order.refunded'
  | 'subscription.started'
  | 'subscription.cancelled'
  | 'subscription.renewed';

interface KiwifyWebhookPayload {
  event: KiwifyEventType;
  order_id: string;
  order_ref: string;
  product_id: string;
  product_name: string;
  customer: {
    email: string;
    name: string;
    phone?: string;
    cpf?: string;
  };
  payment: {
    method: string;
    status: string;
    amount: number;
    installments?: number;
  };
  subscription?: {
    id: string;
    status: string;
    plan: string;
    next_charge_date?: string;
  };
  created_at: string;
  webhook_token?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Receber dados do webhook
    const payload: KiwifyWebhookPayload = await request.json();

    // Validar token do webhook
    const receivedToken = payload.webhook_token || request.headers.get('x-kiwify-token');
    
    if (receivedToken !== KIWIFY_WEBHOOK_TOKEN) {
      console.error('Token inválido recebido:', receivedToken);
      return NextResponse.json(
        { success: false, error: 'Token de autenticação inválido' },
        { status: 401 }
      );
    }

    // Verificar se o Supabase está configurado
    if (!supabase) {
      console.error('Supabase não configurado');
      return NextResponse.json(
        { success: false, error: 'Configuração do banco de dados ausente' },
        { status: 500 }
      );
    }

    console.log('Webhook recebido da Kiwify:', {
      event: payload.event,
      order_id: payload.order_id,
      customer_email: payload.customer.email,
    });

    // Processar evento baseado no tipo
    switch (payload.event) {
      case 'order.paid':
      case 'subscription.started':
        await handlePaymentApproved(payload);
        break;

      case 'subscription.renewed':
        await handleSubscriptionRenewed(payload);
        break;

      case 'order.refused':
        await handlePaymentRefused(payload);
        break;

      case 'order.refunded':
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload);
        break;

      default:
        console.log('Evento não tratado:', payload.event);
    }

    // Retornar sucesso para a Kiwify
    return NextResponse.json({ success: true, received: true });

  } catch (error) {
    console.error('Erro ao processar webhook da Kiwify:', error);
    
    // Retornar erro mas com status 200 para não reenviar o webhook
    return NextResponse.json(
      { success: false, error: 'Erro ao processar webhook' },
      { status: 200 }
    );
  }
}

// Função para lidar com pagamento aprovado
async function handlePaymentApproved(payload: KiwifyWebhookPayload) {
  if (!supabase) return;

  try {
    // Determinar tipo de plano baseado no produto
    const planType = payload.product_name.toLowerCase().includes('anual') 
      ? 'annual' 
      : 'monthly';

    // Calcular data de expiração
    const expiresAt = new Date();
    if (planType === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    // Verificar se já existe uma assinatura com este transaction_id
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('transaction_id', payload.order_id)
      .single();

    if (existingSubscription) {
      console.log('Assinatura já existe para este pedido:', payload.order_id);
      return;
    }

    // Inserir nova assinatura
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_email: payload.customer.email,
        user_name: payload.customer.name,
        user_phone: payload.customer.phone || null,
        user_cpf: payload.customer.cpf || null,
        plan_type: planType,
        amount: payload.payment.amount,
        status: 'active',
        transaction_id: payload.order_id,
        payment_method: payload.payment.method,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('Erro ao criar assinatura:', subscriptionError);
      throw subscriptionError;
    }

    // Inserir histórico de pagamento
    await supabase
      .from('payment_history')
      .insert({
        subscription_id: subscription.id,
        amount: payload.payment.amount,
        status: 'approved',
        transaction_id: payload.order_id,
        metadata: {
          event: payload.event,
          order_ref: payload.order_ref,
          product_name: payload.product_name,
          payment_method: payload.payment.method,
          installments: payload.payment.installments,
          subscription_id: payload.subscription?.id,
        },
      });

    console.log('Assinatura criada com sucesso:', subscription.id);

  } catch (error) {
    console.error('Erro ao processar pagamento aprovado:', error);
    throw error;
  }
}

// Função para lidar com renovação de assinatura
async function handleSubscriptionRenewed(payload: KiwifyWebhookPayload) {
  if (!supabase) return;

  try {
    // Buscar assinatura existente pelo email
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id, plan_type')
      .eq('user_email', payload.customer.email)
      .eq('status', 'active')
      .single();

    if (!subscription) {
      console.log('Assinatura não encontrada para renovação:', payload.customer.email);
      return;
    }

    // Calcular nova data de expiração
    const expiresAt = new Date();
    if (subscription.plan_type === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    // Atualizar data de expiração
    await supabase
      .from('subscriptions')
      .update({
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    // Inserir histórico de pagamento
    await supabase
      .from('payment_history')
      .insert({
        subscription_id: subscription.id,
        amount: payload.payment.amount,
        status: 'approved',
        transaction_id: payload.order_id,
        metadata: {
          event: payload.event,
          order_ref: payload.order_ref,
          renewal: true,
        },
      });

    console.log('Assinatura renovada com sucesso:', subscription.id);

  } catch (error) {
    console.error('Erro ao processar renovação:', error);
    throw error;
  }
}

// Função para lidar com pagamento recusado
async function handlePaymentRefused(payload: KiwifyWebhookPayload) {
  if (!supabase) return;

  try {
    // Buscar assinatura pelo transaction_id
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('transaction_id', payload.order_id)
      .single();

    if (subscription) {
      // Inserir histórico de pagamento recusado
      await supabase
        .from('payment_history')
        .insert({
          subscription_id: subscription.id,
          amount: payload.payment.amount,
          status: 'rejected',
          transaction_id: payload.order_id,
          metadata: {
            event: payload.event,
            order_ref: payload.order_ref,
            reason: 'payment_refused',
          },
        });
    }

    console.log('Pagamento recusado registrado:', payload.order_id);

  } catch (error) {
    console.error('Erro ao processar pagamento recusado:', error);
    throw error;
  }
}

// Função para lidar com cancelamento de assinatura
async function handleSubscriptionCancelled(payload: KiwifyWebhookPayload) {
  if (!supabase) return;

  try {
    // Buscar assinatura pelo email
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_email', payload.customer.email)
      .eq('status', 'active')
      .single();

    if (!subscription) {
      console.log('Assinatura não encontrada para cancelamento:', payload.customer.email);
      return;
    }

    // Atualizar status da assinatura
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    // Inserir histórico
    await supabase
      .from('payment_history')
      .insert({
        subscription_id: subscription.id,
        amount: payload.payment.amount,
        status: 'rejected',
        transaction_id: payload.order_id,
        metadata: {
          event: payload.event,
          order_ref: payload.order_ref,
          reason: payload.event === 'order.refunded' ? 'refunded' : 'cancelled',
        },
      });

    console.log('Assinatura cancelada com sucesso:', subscription.id);

  } catch (error) {
    console.error('Erro ao processar cancelamento:', error);
    throw error;
  }
}
