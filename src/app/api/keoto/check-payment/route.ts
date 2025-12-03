import { NextRequest, NextResponse } from 'next/server';
import { getKeoToPaymentStatus } from '@/lib/keoto';

export async function GET(request: NextRequest) {
  try {
    console.log('🟢 API check-payment chamada');
    
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      console.error('❌ paymentId não fornecido');
      return NextResponse.json(
        { error: 'paymentId é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🟢 Verificando pagamento:', paymentId);

    // Consultar status do pagamento na Keoto
    const payment = await getKeoToPaymentStatus(paymentId);

    console.log('✅ Status verificado:', payment.status);

    return NextResponse.json(payment);
  } catch (error: any) {
    console.error('❌ Erro na API check-payment:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao verificar pagamento' },
      { status: 500 }
    );
  }
}
