"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { kiwifyClient } from "@/lib/kiwify";
import { ShoppingCart, Package, DollarSign, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

interface Product {
  id: string;
  name: string;
  price: number;
  status: string;
  description?: string;
}

interface Order {
  id: string;
  product_id: string;
  customer_email: string;
  customer_name: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function KiwifyDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = () => {
    const configured = kiwifyClient.isConfigured();
    setIsConfigured(configured);
    
    if (configured) {
      loadData();
    } else {
      setLoading(false);
      toast.error("Credenciais da Kiwify não configuradas");
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carrega produtos e pedidos em paralelo
      const [productsData, ordersData] = await Promise.all([
        kiwifyClient.getProducts().catch(() => []),
        kiwifyClient.getOrders({ limit: 10 }).catch(() => []),
      ]);

      setProducts(productsData);
      setOrders(ordersData);
      toast.success("Dados carregados com sucesso!");
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados da Kiwify");
    } finally {
      setLoading(false);
    }
  };

  const createPaymentLink = async (productId: string) => {
    try {
      const { payment_url } = await kiwifyClient.createPaymentLink(productId);
      window.open(payment_url, '_blank');
      toast.success("Link de pagamento criado!");
    } catch (error) {
      console.error("Erro ao criar link:", error);
      toast.error("Erro ao criar link de pagamento");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados da Kiwify...</p>
        </div>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 flex items-center justify-center p-4">
        <Toaster />
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-6 h-6" />
              Configuração Necessária
            </CardTitle>
            <CardDescription>
              As credenciais da Kiwify não estão configuradas corretamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Verifique se as seguintes variáveis de ambiente estão configuradas no arquivo .env.local:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>NEXT_PUBLIC_KIWIFY_CLIENT_ID</li>
              <li>KIWIFY_CLIENT_SECRET</li>
              <li>NEXT_PUBLIC_KIWIFY_ACCOUNT_ID</li>
            </ul>
            <Button onClick={() => window.location.reload()} className="w-full">
              Recarregar Página
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 p-4 md:p-8">
      <Toaster />
      
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Kiwify</h1>
            <p className="text-gray-600">Gerencie seus produtos e vendas</p>
          </div>
          <Button onClick={loadData} variant="outline">
            Atualizar Dados
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-blue-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Produtos
              </CardTitle>
              <Package className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-800">{products.length}</div>
            </CardContent>
          </Card>

          <Card className="border-blue-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pedidos Recentes
              </CardTitle>
              <ShoppingCart className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-800">{orders.length}</div>
            </CardContent>
          </Card>

          <Card className="border-blue-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Receita Total
              </CardTitle>
              <DollarSign className="w-5 h-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-800">
                R$ {orders.reduce((sum, order) => sum + order.amount, 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Seus Produtos</h2>
          {products.length === 0 ? (
            <Card className="border-blue-100">
              <CardContent className="py-12 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum produto encontrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="border-blue-100 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg text-gray-800">{product.name}</CardTitle>
                      <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                        {product.status}
                      </Badge>
                    </div>
                    {product.description && (
                      <CardDescription className="line-clamp-2">
                        {product.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-2xl font-bold text-gray-800">
                      R$ {product.price.toFixed(2)}
                    </div>
                    <Button
                      onClick={() => createPaymentLink(product.id)}
                      className="w-full bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Criar Link de Pagamento
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Orders Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Pedidos Recentes</h2>
          {orders.length === 0 ? (
            <Card className="border-blue-100">
              <CardContent className="py-12 text-center">
                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum pedido encontrado</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-blue-100">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Valor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Data
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-800">
                            {order.customer_name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {order.customer_email}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-800">
                            R$ {order.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={order.status === 'paid' ? 'default' : 'secondary'}>
                              {order.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Configuration Info */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              API Configurada com Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-green-700">
            <p>✓ Client ID: {process.env.NEXT_PUBLIC_KIWIFY_CLIENT_ID}</p>
            <p>✓ Account ID: {process.env.NEXT_PUBLIC_KIWIFY_ACCOUNT_ID}</p>
            <p>✓ Client Secret: Configurado (oculto por segurança)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
