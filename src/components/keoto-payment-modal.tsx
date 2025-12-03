"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, QrCode, Copy, CheckCircle2, Clock, AlertCircle, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { isPaymentApproved, isPaymentPending, isPaymentFailed } from "@/lib/keoto";
import { CreditCardForm, CreditCardData } from "@/components/credit-card-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface KeoToPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  amount: number;
  description: string;
}

export function KeoToPaymentModal({
  open,
  onOpenChange,
  planName,
  amount,
  description,
}: KeoToPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerDocument, setCustomerDocument] = useState("");
  const [paymentData, setPaymentData] = useState<any>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"form" | "payment" | "success">("form");
  const [paymentCheckInterval, setPaymentCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credit_card">("pix");

  const handleCreatePayment = async (cardData?: CreditCardData) => {
    if (!customerName || !customerEmail) {
      toast.error("Preencha nome e email");
      return;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      toast.error("Email inválido");
      return;
    }

    setLoading(true);
    try {
      const paymentPayload: any = {
        amount,
        description: `${planName} - ${description}`,
        customer: {
          name: customerName,
          email: customerEmail,
          document: customerDocument || undefined,
        },
        metadata: {
          plan: planName,
        },
        payment_method: paymentMethod,
      };

      // Se for cartão de crédito, adicionar dados do cartão
      if (paymentMethod === "credit_card" && cardData) {
        paymentPayload.card = {
          number: cardData.cardNumber,
          holder_name: cardData.cardName,
          expiry_date: cardData.expiryDate,
          cvv: cardData.cvv,
        };
      }

      const response = await fetch("/api/keoto/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentPayload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar pagamento");
      }

      const data = await response.json();
      
      // Verificar se recebemos os dados necessários
      if (!data.id) {
        throw new Error("Resposta inválida da API de pagamentos");
      }

      setPaymentData(data);
      
      // Se for cartão de crédito e já foi aprovado, ir direto para sucesso
      if (paymentMethod === "credit_card" && isPaymentApproved(data.status)) {
        setPaymentStep("success");
        toast.success("Pagamento aprovado! 🎉");
        
        // Redirecionar após 3 segundos
        setTimeout(() => {
          onOpenChange(false);
          window.location.href = "/dashboard";
        }, 3000);
      } else {
        setPaymentStep("payment");
        toast.success("Pagamento criado com sucesso!");
        
        // Iniciar verificação automática do pagamento apenas para PIX
        if (paymentMethod === "pix") {
          startPaymentCheck(data.id);
        }
      }
    } catch (error: any) {
      console.error("Erro:", error);
      toast.error(error.message || "Erro ao processar pagamento");
    } finally {
      setLoading(false);
    }
  };

  const handleCreditCardSubmit = (cardData: CreditCardData) => {
    handleCreatePayment(cardData);
  };

  const startPaymentCheck = (paymentId: string) => {
    setCheckingPayment(true);
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/keoto/check-payment?paymentId=${paymentId}`);
        
        if (response.ok) {
          const data = await response.json();
          
          // Verificar se pagamento foi aprovado
          if (isPaymentApproved(data.status)) {
            clearInterval(interval);
            setPaymentCheckInterval(null);
            setPaymentStep("success");
            setCheckingPayment(false);
            toast.success("Pagamento confirmado! 🎉");
            
            // Redirecionar após 3 segundos
            setTimeout(() => {
              onOpenChange(false);
              window.location.href = "/dashboard";
            }, 3000);
          }
          
          // Verificar se pagamento falhou
          if (isPaymentFailed(data.status)) {
            clearInterval(interval);
            setPaymentCheckInterval(null);
            setCheckingPayment(false);
            toast.error("Pagamento não foi concluído. Tente novamente.");
          }
        }
      } catch (error) {
        console.error("Erro ao verificar pagamento:", error);
      }
    }, 5000); // Verifica a cada 5 segundos

    setPaymentCheckInterval(interval);

    // Limpar intervalo após 10 minutos
    setTimeout(() => {
      if (interval) {
        clearInterval(interval);
        setPaymentCheckInterval(null);
        setCheckingPayment(false);
      }
    }, 600000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const handleClose = () => {
    // Limpar intervalo de verificação se existir
    if (paymentCheckInterval) {
      clearInterval(paymentCheckInterval);
      setPaymentCheckInterval(null);
    }
    
    setPaymentData(null);
    setCustomerName("");
    setCustomerEmail("");
    setCustomerDocument("");
    setPaymentStep("form");
    setCheckingPayment(false);
    setPaymentMethod("pix");
    onOpenChange(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusDisplay = (status: string) => {
    if (isPaymentApproved(status)) {
      return { text: "Aprovado", color: "text-green-600", icon: CheckCircle2 };
    }
    if (isPaymentFailed(status)) {
      return { text: "Falhou", color: "text-red-600", icon: AlertCircle };
    }
    return { text: "Aguardando", color: "text-amber-600", icon: Clock };
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">Finalizar Assinatura</DialogTitle>
                <DialogDescription className="text-sm">
                  {planName}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Resumo do Pedido */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total a pagar</p>
                <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
                  {formatCurrency(amount)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{description}</p>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Acesso imediato</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulário de Dados */}
        {paymentStep === "form" && (
          <div className="space-y-4 py-4">
            {/* Dados do Cliente */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nome Completo *
                </Label>
                <Input
                  id="name"
                  placeholder="Digite seu nome completo"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document" className="text-sm font-medium">
                  CPF/CNPJ (opcional)
                </Label>
                <Input
                  id="document"
                  placeholder="000.000.000-00"
                  value={customerDocument}
                  onChange={(e) => setCustomerDocument(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            {/* Métodos de Pagamento */}
            <div className="space-y-4 pt-4">
              <Label className="text-sm font-medium">Método de Pagamento</Label>
              
              <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "pix" | "credit_card")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="pix" className="flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    PIX
                  </TabsTrigger>
                  <TabsTrigger value="credit_card" className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Cartão de Crédito
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pix" className="space-y-4 mt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <QrCode className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Pagamento via PIX</p>
                        <p className="text-blue-600">
                          Após preencher os dados, você receberá um QR Code para pagamento instantâneo via PIX.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleCreatePayment()}
                    disabled={loading || !customerName || !customerEmail}
                    className="w-full h-12 bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white font-medium text-base"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Gerando pagamento...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-5 h-5 mr-2" />
                        Gerar QR Code PIX
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="credit_card" className="space-y-4 mt-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CreditCard className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-green-800">
                        <p className="font-medium mb-1">Pagamento com Cartão</p>
                        <p className="text-green-600">
                          Pagamento processado instantaneamente. Acesso liberado imediatamente após aprovação.
                        </p>
                      </div>
                    </div>
                  </div>

                  <CreditCardForm 
                    onSubmit={handleCreditCardSubmit}
                    loading={loading}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}

        {/* Tela de Pagamento PIX */}
        {paymentStep === "payment" && paymentData && paymentMethod === "pix" && (
          <div className="space-y-4 py-4">
            {/* Status de Verificação */}
            {checkingPayment && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800">Aguardando pagamento</p>
                      <p className="text-sm text-blue-600">Verificando automaticamente...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* QR Code */}
            {(paymentData.qr_code || paymentData.qr_code_url) && (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 text-gray-700">
                      <QrCode className="w-5 h-5" />
                      <h3 className="font-semibold text-lg">Escaneie o QR Code</h3>
                    </div>
                    <div className="flex justify-center p-6 bg-white rounded-xl border-2 border-dashed border-gray-300">
                      <img 
                        src={paymentData.qr_code || paymentData.qr_code_url} 
                        alt="QR Code PIX" 
                        className="w-64 h-64"
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      Abra o app do seu banco e escaneie o código
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Código PIX Copia e Cola */}
            {(paymentData.pix_code || paymentData.pix_copy_paste) && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">
                      Ou copie o código PIX
                    </Label>
                    <div className="flex gap-2">
                      <Input 
                        value={paymentData.pix_code || paymentData.pix_copy_paste} 
                        readOnly 
                        className="font-mono text-xs bg-gray-50"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(paymentData.pix_code || paymentData.pix_copy_paste)}
                        className="flex-shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Cole este código no app do seu banco na opção PIX Copia e Cola
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Link de Pagamento */}
            {paymentData.payment_url && (
              <Button
                onClick={() => window.open(paymentData.payment_url, "_blank")}
                variant="outline"
                className="w-full h-11"
              >
                Abrir Link de Pagamento
              </Button>
            )}

            {/* Informações Adicionais */}
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">ID do Pagamento:</span>
                    <span className="font-mono text-xs text-gray-800">{paymentData.id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`flex items-center gap-1 ${getStatusDisplay(paymentData.status).color}`}>
                      {(() => {
                        const StatusIcon = getStatusDisplay(paymentData.status).icon;
                        return <StatusIcon className="w-3 h-3" />;
                      })()}
                      {getStatusDisplay(paymentData.status).text}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Pagamento em análise</p>
                  <p className="text-amber-700">
                    Após o pagamento, a confirmação é automática e instantânea. Você será redirecionado automaticamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tela de Sucesso */}
        {paymentStep === "success" && (
          <div className="py-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Pagamento Confirmado!
                </h3>
                <p className="text-gray-600">
                  Sua assinatura foi ativada com sucesso
                </p>
              </div>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Plano:</span>
                      <span className="font-medium text-gray-800">{planName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Valor:</span>
                      <span className="font-medium text-gray-800">{formatCurrency(amount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <p className="text-sm text-gray-500">
                Redirecionando para o dashboard...
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
