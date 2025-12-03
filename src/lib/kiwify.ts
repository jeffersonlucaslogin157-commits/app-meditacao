/**
 * Cliente para integração com a API da Kiwify
 * Documentação: https://developers.kiwify.com.br
 */

const KIWIFY_API_BASE_URL = 'https://public-api.kiwify.com.br';

export interface KiwifyProduct {
  id: string;
  name: string;
  price: number;
  status: string;
  description?: string;
}

export interface KiwifyOrder {
  id: string;
  product_id: string;
  customer_email: string;
  customer_name: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface KiwifyWebhookEvent {
  event: string;
  data: any;
}

class KiwifyClient {
  private clientId: string;
  private clientSecret: string;
  private accountId: string;

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_KIWIFY_CLIENT_ID || '';
    this.clientSecret = process.env.KIWIFY_CLIENT_SECRET || '';
    this.accountId = process.env.NEXT_PUBLIC_KIWIFY_ACCOUNT_ID || '';

    if (!this.clientId || !this.clientSecret || !this.accountId) {
      console.warn('Kiwify credentials not configured');
    }
  }

  /**
   * Verifica se as credenciais estão configuradas
   */
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret && this.accountId);
  }

  /**
   * Faz requisição autenticada para a API da Kiwify
   */
  private async request(endpoint: string, options: RequestInit = {}) {
    if (!this.isConfigured()) {
      throw new Error('Kiwify credentials not configured');
    }

    const url = `${KIWIFY_API_BASE_URL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.clientSecret}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kiwify API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Lista todos os produtos
   */
  async getProducts(): Promise<KiwifyProduct[]> {
    return this.request('/products');
  }

  /**
   * Obtém detalhes de um produto específico
   */
  async getProduct(productId: string): Promise<KiwifyProduct> {
    return this.request(`/products/${productId}`);
  }

  /**
   * Lista pedidos/vendas
   */
  async getOrders(params?: {
    status?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<KiwifyOrder[]> {
    const queryParams = new URLSearchParams(params as any);
    return this.request(`/orders?${queryParams.toString()}`);
  }

  /**
   * Obtém detalhes de um pedido específico
   */
  async getOrder(orderId: string): Promise<KiwifyOrder> {
    return this.request(`/orders/${orderId}`);
  }

  /**
   * Cria um link de pagamento para um produto
   */
  async createPaymentLink(productId: string, customData?: any): Promise<{ payment_url: string }> {
    return this.request('/payment-links', {
      method: 'POST',
      body: JSON.stringify({
        product_id: productId,
        account_id: this.accountId,
        ...customData,
      }),
    });
  }

  /**
   * Valida webhook da Kiwify
   */
  validateWebhook(signature: string, payload: string): boolean {
    // Implementar validação de assinatura do webhook
    // A Kiwify envia um header com a assinatura para validar
    return true; // Placeholder
  }

  /**
   * Processa evento de webhook
   */
  async processWebhook(event: KiwifyWebhookEvent): Promise<void> {
    switch (event.event) {
      case 'order.paid':
        // Processar pagamento aprovado
        console.log('Pagamento aprovado:', event.data);
        break;
      case 'order.refunded':
        // Processar reembolso
        console.log('Reembolso processado:', event.data);
        break;
      case 'subscription.created':
        // Processar nova assinatura
        console.log('Nova assinatura:', event.data);
        break;
      case 'subscription.cancelled':
        // Processar cancelamento de assinatura
        console.log('Assinatura cancelada:', event.data);
        break;
      default:
        console.log('Evento não tratado:', event.event);
    }
  }
}

// Exporta instância única do cliente
export const kiwifyClient = new KiwifyClient();

// Exporta classe para uso em testes ou instâncias customizadas
export default KiwifyClient;
