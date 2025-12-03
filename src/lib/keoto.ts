// Configuração da API Keoto
const KEOTO_API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb21wYW55SWQiOjY2OCwiaWF0IjoxNzY0NTE1MDAwLCJleHAiOjE3OTYwNTEwMDAsInN1YiI6ImU5ZDYyMzExLTIxZDctNDNlNy04NDM1LWMxNmI2NGZlZmIwMSJ9.S-YtzwCEr1bEqsdn3uT0xbiJ8uEwDZli71ugwcetom0';
const KEOTO_API_URL = 'https://api.keoto.app/v1';

export interface KeoToPaymentData {
  amount: number;
  description: string;
  customer: {
    name: string;
    email: string;
    document?: string;
  };
  payment_method?: 'pix' | 'credit_card';
  card?: {
    number: string;
    holder_name: string;
    expiry_date: string;
    cvv: string;
  };
  metadata?: Record<string, any>;
}

export interface KeoToPaymentResponse {
  id: string;
  status: string;
  payment_url?: string;
  qr_code?: string;
  qr_code_url?: string;
  pix_code?: string;
  pix_copy_paste?: string;
  amount?: number;
  created_at?: string;
  expires_at?: string;
}

/**
 * Função auxiliar para criar timeout manual
 */
function createTimeout(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

/**
 * Cria um pagamento na Keoto
 * IMPORTANTE: Esta função deve ser executada APENAS no servidor (API Routes)
 */
export async function createKeoToPayment(data: KeoToPaymentData): Promise<KeoToPaymentResponse> {
  try {
    const paymentPayload: any = {
      amount: data.amount,
      description: data.description,
      customer: {
        name: data.customer.name,
        email: data.customer.email,
        ...(data.customer.document && { document: data.customer.document }),
      },
      payment_method: data.payment_method || 'pix',
      ...(data.metadata && { metadata: data.metadata }),
    };

    // Se for cartão de crédito, adicionar dados do cartão
    if (data.payment_method === 'credit_card' && data.card) {
      paymentPayload.card = {
        number: data.card.number,
        holder_name: data.card.holder_name,
        expiry_date: data.card.expiry_date,
        cvv: data.card.cvv,
      };
    }

    console.log('🔵 Criando pagamento Keoto:', JSON.stringify({
      ...paymentPayload,
      // Ocultar dados sensíveis do cartão nos logs
      ...(paymentPayload.card && {
        card: {
          number: '****' + paymentPayload.card.number.slice(-4),
          holder_name: paymentPayload.card.holder_name,
          expiry_date: paymentPayload.card.expiry_date,
          cvv: '***',
        }
      })
    }, null, 2));

    const response = await fetch(`${KEOTO_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KEOTO_API_TOKEN}`,
      },
      body: JSON.stringify(paymentPayload),
    });

    const responseText = await response.text();
    console.log('🔵 Resposta Keoto (status):', response.status);
    console.log('🔵 Resposta Keoto (body):', responseText);

    if (!response.ok) {
      let errorMessage = 'Erro ao criar pagamento';
      
      try {
        const errorJson = JSON.parse(responseText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = responseText || errorMessage;
      }
      
      console.error('❌ Erro na API Keoto:', errorMessage);
      throw new Error(errorMessage);
    }

    const result = JSON.parse(responseText);
    
    // Normalizar resposta para garantir compatibilidade
    const normalizedResult = {
      ...result,
      qr_code: result.qr_code || result.qr_code_url,
      pix_code: result.pix_code || result.pix_copy_paste,
    };

    console.log('✅ Pagamento criado com sucesso:', normalizedResult.id);
    
    return normalizedResult;
  } catch (error: any) {
    console.error('❌ Erro ao criar pagamento Keoto:', error);
    
    // Melhorar mensagem de erro
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw new Error('A conexão com a API de pagamentos demorou muito. Tente novamente.');
    }
    
    if (error.message && (error.message.includes('fetch') || error.message.includes('network'))) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }
    
    throw new Error(error.message || 'Erro ao processar pagamento');
  }
}

/**
 * Consulta o status de um pagamento
 * IMPORTANTE: Esta função deve ser executada APENAS no servidor (API Routes)
 */
export async function getKeoToPaymentStatus(paymentId: string): Promise<KeoToPaymentResponse> {
  try {
    console.log('🔵 Consultando status do pagamento:', paymentId);

    const response = await fetch(`${KEOTO_API_URL}/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${KEOTO_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Erro ao consultar pagamento';
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      console.error('❌ Erro ao consultar pagamento:', errorMessage);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    // Normalizar resposta
    const normalizedResult = {
      ...result,
      qr_code: result.qr_code || result.qr_code_url,
      pix_code: result.pix_code || result.pix_copy_paste,
    };

    console.log('✅ Status do pagamento:', normalizedResult.status);
    
    return normalizedResult;
  } catch (error: any) {
    console.error('❌ Erro ao consultar pagamento Keoto:', error);
    
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw new Error('A conexão com a API de pagamentos demorou muito. Tente novamente.');
    }
    
    if (error.message && (error.message.includes('fetch') || error.message.includes('network'))) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }
    
    throw new Error(error.message || 'Erro ao verificar status do pagamento');
  }
}

/**
 * Cancela um pagamento
 * IMPORTANTE: Esta função deve ser executada APENAS no servidor (API Routes)
 */
export async function cancelKeoToPayment(paymentId: string): Promise<void> {
  try {
    console.log('🔵 Cancelando pagamento:', paymentId);

    const response = await fetch(`${KEOTO_API_URL}/payments/${paymentId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KEOTO_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Erro ao cancelar pagamento';
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      console.error('❌ Erro ao cancelar pagamento:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log('✅ Pagamento cancelado com sucesso');
  } catch (error: any) {
    console.error('❌ Erro ao cancelar pagamento Keoto:', error);
    
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw new Error('A conexão com a API de pagamentos demorou muito. Tente novamente.');
    }
    
    if (error.message && (error.message.includes('fetch') || error.message.includes('network'))) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }
    
    throw new Error(error.message || 'Erro ao cancelar pagamento');
  }
}

/**
 * Verifica se o pagamento foi aprovado/pago
 */
export function isPaymentApproved(status: string): boolean {
  const approvedStatuses = ['paid', 'approved', 'confirmed', 'completed'];
  return approvedStatuses.includes(status.toLowerCase());
}

/**
 * Verifica se o pagamento está pendente
 */
export function isPaymentPending(status: string): boolean {
  const pendingStatuses = ['pending', 'waiting', 'processing', 'created'];
  return pendingStatuses.includes(status.toLowerCase());
}

/**
 * Verifica se o pagamento falhou ou foi cancelado
 */
export function isPaymentFailed(status: string): boolean {
  const failedStatuses = ['failed', 'cancelled', 'canceled', 'expired', 'rejected'];
  return failedStatuses.includes(status.toLowerCase());
}
