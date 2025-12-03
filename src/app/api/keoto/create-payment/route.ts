import { NextRequest, NextResponse } from 'next/server';
import { createKeoToPayment } from '@/lib/keoto';

export async function POST(request: NextRequest) {
  try {
    console.log('🟢 API create-payment chamada');
    
    const body = await request.json();
    console.log('🟢 Dados recebidos:', JSON.stringify({
      ...body,
      // Ocultar dados sensíveis do cartão nos logs
      ...(body.card && {
        card: {
          number: '****' + body.card.number?.slice(-4),
          holder_name: body.card.holder_name,
          expiry_date: body.card.expiry_date,
          cvv: '***',
        }
      })
    }, null, 2));
    
    // Validar dados obrigatórios
    if (!body.amount || !body.customer?.name || !body.customer?.email) {
      console.error('❌ Dados obrigatórios faltando');
      return NextResponse.json(
        { error: 'Dados obrigatórios faltando: amount, customer.name, customer.email' },
        { status: 400 }
      );
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.customer.email)) {
      console.error('❌ Email inválido:', body.customer.email);
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Validar dados do cartão se for pagamento com cartão
    if (body.payment_method === 'credit_card') {
      if (!body.card || !body.card.number || !body.card.holder_name || !body.card.expiry_date || !body.card.cvv) {
        console.error('❌ Dados do cartão incompletos');
        return NextResponse.json(
          { error: 'Dados do cartão incompletos' },
          { status: 400 }
        );
      }

      // Validar número do cartão (13-19 dígitos)
      const cardNumber = body.card.number.replace(/\s/g, '');
      if (cardNumber.length < 13 || cardNumber.length > 19 || !/^\d+$/.test(cardNumber)) {
        console.error('❌ Número do cartão inválido');
        return NextResponse.json(
          { error: 'Número do cartão inválido' },
          { status: 400 }
        );
      }

      // Validar data de validade (MM/AA)
      if (!/^\d{2}\/\d{2}$/.test(body.card.expiry_date)) {
        console.error('❌ Data de validade inválida');
        return NextResponse.json(
          { error: 'Data de validade inválida. Use o formato MM/AA' },
          { status: 400 }
        );
      }

      // Validar CVV (3-4 dígitos)
      if (body.card.cvv.length < 3 || body.card.cvv.length > 4 || !/^\d+$/.test(body.card.cvv)) {
        console.error('❌ CVV inválido');
        return NextResponse.json(
          { error: 'CVV inválido' },
          { status: 400 }
        );
      }
    }

    console.log('🟢 Criando pagamento na Keoto...');

    // Criar pagamento na Keoto
    const payment = await createKeoToPayment({
      amount: body.amount,
      description: body.description || 'Pagamento',
      customer: {
        name: body.customer.name,
        email: body.customer.email,
        document: body.customer.document,
      },
      payment_method: body.payment_method || 'pix',
      ...(body.card && { card: body.card }),
      metadata: body.metadata,
    });

    console.log('✅ Pagamento criado com sucesso:', payment.id);

    return NextResponse.json(payment);
  } catch (error: any) {
    console.error('❌ Erro na API create-payment:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar pagamento' },
      { status: 500 }
    );
  }
}
