import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Criar cliente Supabase para uso no servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      planType,
      customerName,
      customerEmail,
      customerPhone,
      customerCpf,
      paymentMethod,
    } = body;

    // Validação básica dos dados
    if (!planType || !customerName || !customerEmail || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Validação do cartão (básica)
    const { cardNumber, cardName, expiryDate, cvv } = paymentMethod;
    
    if (!cardNumber || !cardName || !expiryDate || !cvv) {
      return NextResponse.json(
        { success: false, error: 'Dados do cartão incompletos' },
        { status: 400 }
      );
    }

    // Validação do número do cartão (deve ter 16 dígitos)
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanCardNumber.length < 13 || cleanCardNumber.length > 16) {
      return NextResponse.json(
        { success: false, error: 'Número do cartão inválido' },
        { status: 400 }
      );
    }

    // Validação da data de validade
    const [month, year] = expiryDate.split('/');
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    
    if (!month || !year || parseInt(month) < 1 || parseInt(month) > 12) {
      return NextResponse.json(
        { success: false, error: 'Data de validade inválida' },
        { status: 400 }
      );
    }

    if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
      return NextResponse.json(
        { success: false, error: 'Cartão expirado' },
        { status: 400 }
      );
    }

    // Validação do CVV
    if (cvv.length < 3 || cvv.length > 4) {
      return NextResponse.json(
        { success: false, error: 'CVV inválido' },
        { status: 400 }
      );
    }

    // Calcular valor e data de expiração
    const amount = planType === 'monthly' ? 29.90 : 179.90;
    const expiresAt = new Date();
    if (planType === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    // AQUI VOCÊ DEVE INTEGRAR COM SUA GATEWAY DE PAGAMENTO REAL
    // Exemplos: Stripe, Mercado Pago, PagSeguro, Kiwify, etc.
    
    console.log('Processando pagamento:', {
      planType,
      customerEmail,
      amount,
    });

    // Simula delay de processamento
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simula aprovação (em produção, isso viria da gateway)
    const paymentApproved = true;

    if (paymentApproved) {
      const transactionId = `TXN-${Date.now()}`;
      
      // Salvar assinatura no Supabase
      if (supabase) {
        try {
          // Inserir assinatura
          const { data: subscription, error: subscriptionError } = await supabase
            .from('subscriptions')
            .insert({
              user_email: customerEmail,
              user_name: customerName,
              user_phone: customerPhone,
              user_cpf: customerCpf,
              plan_type: planType,
              amount,
              status: 'active',
              transaction_id: transactionId,
              payment_method: 'credit_card',
              expires_at: expiresAt.toISOString(),
            })
            .select()
            .single();

          if (subscriptionError) {
            console.error('Erro ao salvar assinatura:', subscriptionError);
            // Continua mesmo com erro no banco (pagamento foi aprovado)
          } else {
            // Inserir histórico de pagamento
            await supabase
              .from('payment_history')
              .insert({
                subscription_id: subscription.id,
                amount,
                status: 'approved',
                transaction_id: transactionId,
                metadata: {
                  plan_type: planType,
                  customer_name: customerName,
                  customer_email: customerEmail,
                },
              });
          }
        } catch (dbError) {
          console.error('Erro ao salvar no banco:', dbError);
          // Continua mesmo com erro no banco (pagamento foi aprovado)
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Pagamento processado com sucesso',
        data: {
          transactionId,
          planType,
          customerEmail,
          activatedAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Pagamento recusado' },
        { status: 402 }
      );
    }

  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno ao processar pagamento. Tente novamente.' 
      },
      { status: 500 }
    );
  }
}
