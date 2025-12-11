"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, CreditCard, Lock, Check, Download, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planType: 'monthly' | 'annual';
  planName: string;
  planPrice: string;
  planFeatures: string[];
  onSuccess?: () => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  planType,
  planName,
  planPrice,
  planFeatures,
  onSuccess,
}: CheckoutModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'info' | 'payment' | 'success'>('info');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19);
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      return cleaned
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      return cleaned
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
    return value;
  };

  const handleNextStep = () => {
    if (step === 'info') {
      if (!formData.name || !formData.email || !formData.phone || !formData.cpf) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }
      setStep('payment');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cardNumber || !formData.cardName || !formData.expiryDate || !formData.cvv) {
      toast.error("Preencha todos os dados do cartão");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/kiwify/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          customerCpf: formData.cpf,
          paymentMethod: {
            cardNumber: formData.cardNumber.replace(/\s/g, ''),
            cardName: formData.cardName,
            expiryDate: formData.expiryDate,
            cvv: formData.cvv,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStep('success');
        toast.success("Pagamento processado com sucesso!");
        
        // Chamar callback de sucesso
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(data.error || "Erro ao processar pagamento");
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error("Erro ao processar pagamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    onClose();
    router.push('/login');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Finalizar Assinatura</h2>
            <p className="text-sm text-gray-600">Plano {planName} - {planPrice}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Formulário */}
            <div>
              {step === 'success' ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Pagamento Aprovado!</h3>
                  <p className="text-gray-600 mb-6">
                    Sua assinatura foi ativada com sucesso.
                  </p>
                  
                  {/* Botão de ação */}
                  <div className="space-y-3">
                    <Button
                      onClick={handleGoToLogin}
                      className="w-full bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white"
                    >
                      <LogIn className="w-5 h-5 mr-2" />
                      Ir para Login e Baixar App
                    </Button>
                    
                    <p className="text-sm text-gray-500">
                      Faça login para acessar o aplicativo e começar sua jornada
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Etapa 1: Informações Pessoais */}
                  {step === 'info' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Informações Pessoais</h3>
                      </div>

                      <div>
                        <Label htmlFor="name">Nome Completo *</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="João Silva"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="email">E-mail *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="joao@exemplo.com"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone">Telefone *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(11) 99999-9999"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="cpf">CPF *</Label>
                        <Input
                          id="cpf"
                          type="text"
                          placeholder="000.000.000-00"
                          value={formData.cpf}
                          onChange={(e) => handleInputChange('cpf', formatCPF(e.target.value))}
                          required
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={handleNextStep}
                        className="w-full bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white"
                      >
                        Continuar para Pagamento
                      </Button>
                    </div>
                  )}

                  {/* Etapa 2: Dados do Cartão */}
                  {step === 'payment' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Dados do Cartão</h3>
                        <button
                          type="button"
                          onClick={() => setStep('info')}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Voltar
                        </button>
                      </div>

                      <div>
                        <Label htmlFor="cardNumber">Número do Cartão *</Label>
                        <div className="relative">
                          <Input
                            id="cardNumber"
                            type="text"
                            placeholder="0000 0000 0000 0000"
                            value={formData.cardNumber}
                            onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                            required
                          />
                          <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="cardName">Nome no Cartão *</Label>
                        <Input
                          id="cardName"
                          type="text"
                          placeholder="JOÃO SILVA"
                          value={formData.cardName}
                          onChange={(e) => handleInputChange('cardName', e.target.value.toUpperCase())}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiryDate">Validade *</Label>
                          <Input
                            id="expiryDate"
                            type="text"
                            placeholder="MM/AA"
                            value={formData.expiryDate}
                            onChange={(e) => handleInputChange('expiryDate', formatExpiryDate(e.target.value))}
                            maxLength={5}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV *</Label>
                          <Input
                            id="cvv"
                            type="text"
                            placeholder="123"
                            value={formData.cvv}
                            onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, '').substring(0, 4))}
                            maxLength={4}
                            required
                          />
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                        <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">Pagamento Seguro</p>
                          <p className="text-xs text-blue-700 mt-1">
                            Seus dados são criptografados e protegidos
                          </p>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white"
                      >
                        {loading ? (
                          <>Processando...</>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Finalizar Pagamento
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </form>
              )}
            </div>

            {/* Resumo do Pedido */}
            <div>
              <Card className="border-blue-100 sticky top-6">
                <CardHeader>
                  <CardTitle className="text-gray-800">Resumo do Pedido</CardTitle>
                  <CardDescription>Plano {planName}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {planFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-800">{planPrice}</span>
                    </div>
                    {planType === 'annual' && (
                      <div className="flex items-center justify-between text-green-600">
                        <span className="text-sm">Desconto (40%)</span>
                        <span className="text-sm font-medium">-R$ 179,00</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
                      <span className="font-bold text-gray-800">Total</span>
                      <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500">
                        {planPrice}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 font-medium mb-2">
                      ✨ Garantia de 7 dias
                    </p>
                    <p className="text-xs text-gray-600">
                      Não gostou? Devolvemos 100% do seu dinheiro, sem perguntas.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
