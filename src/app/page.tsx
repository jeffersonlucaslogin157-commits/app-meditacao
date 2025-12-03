"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { safeAuth, isSupabaseReady } from "@/lib/supabase";
import { Play, Check, Moon, TrendingUp, BookOpen, Bell, Volume2, Star, Users, Award, Sparkles, ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export default function LandingPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Verificar autenticação
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!isSupabaseReady()) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        const { data: { session } } = await safeAuth.getSession();
        setIsAuthenticated(!!session);
      } catch (error) {
        // Silenciosamente trata o erro
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Monitorar mudanças de autenticação
    const { data: { subscription } } = safeAuth.onAuthStateChange(async (event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  const handleGetStarted = () => {
    if (!isSupabaseReady()) {
      toast.error("Sistema de autenticação não configurado. Entre em contato com o suporte.");
      return;
    }

    if (!isAuthenticated) {
      // Se não está autenticado, vai para login
      router.push("/login");
      return;
    }

    // Se está autenticado, vai para o dashboard
    router.push("/dashboard");
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Moon className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50">
      <Toaster />
      
      {/* Header/Navigation */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center">
                <Moon className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">Serenidade</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <button onClick={() => scrollToSection("features")} className="text-gray-600 hover:text-gray-800 transition-colors">
                Recursos
              </button>
              <button onClick={() => scrollToSection("benefits")} className="text-gray-600 hover:text-gray-800 transition-colors">
                Benefícios
              </button>
              <button onClick={() => scrollToSection("testimonials")} className="text-gray-600 hover:text-gray-800 transition-colors">
                Depoimentos
              </button>
              <button onClick={() => scrollToSection("pricing")} className="text-gray-600 hover:text-gray-800 transition-colors">
                Planos
              </button>
              <Button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white"
              >
                {isAuthenticated ? "Ir para o App" : "Começar Agora"}
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-600 hover:text-gray-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 flex flex-col gap-3">
              <button onClick={() => scrollToSection("features")} className="text-left text-gray-600 hover:text-gray-800 py-2">
                Recursos
              </button>
              <button onClick={() => scrollToSection("benefits")} className="text-left text-gray-600 hover:text-gray-800 py-2">
                Benefícios
              </button>
              <button onClick={() => scrollToSection("testimonials")} className="text-left text-gray-600 hover:text-gray-800 py-2">
                Depoimentos
              </button>
              <button onClick={() => scrollToSection("pricing")} className="text-left text-gray-600 hover:text-gray-800 py-2">
                Planos
              </button>
              <Button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white w-full"
              >
                {isAuthenticated ? "Ir para o App" : "Começar Agora"}
              </Button>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Transforme sua vida com meditação
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 leading-tight">
              Encontre paz interior em apenas
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400"> 5 minutos</span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Descubra o poder da meditação guiada com áudio profissional, acompanhamento de progresso e técnicas comprovadas para reduzir ansiedade e melhorar seu sono.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white text-lg px-8 py-6"
              >
                <Play className="w-5 h-5 mr-2" />
                Começar Agora
              </Button>
              <Button
                onClick={() => scrollToSection("features")}
                size="lg"
                variant="outline"
                className="border-blue-200 text-gray-700 hover:bg-blue-50 text-lg px-8 py-6"
              >
                Conhecer Recursos
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 border-2 border-white" />
                  ))}
                </div>
                <span className="text-sm text-gray-600">+10k usuários</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-sm text-gray-600 ml-1">4.9/5</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative z-10 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-blue-100">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                    <Moon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Respiração Consciente</h3>
                    <p className="text-sm text-gray-500">5 minutos • Ansiedade</p>
                  </div>
                </div>
                <div className="h-2 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full animate-pulse" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">127</p>
                    <p className="text-xs text-gray-600">Sessões</p>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">42h</p>
                    <p className="text-xs text-gray-600">Meditadas</p>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-indigo-600">7.5h</p>
                    <p className="text-xs text-gray-600">Sono médio</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full blur-3xl opacity-30" />
            <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-gradient-to-br from-green-200 to-emerald-200 rounded-full blur-3xl opacity-30" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Recursos que transformam sua prática
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tudo que você precisa para desenvolver uma rotina de meditação consistente e eficaz
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-blue-100 hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center mb-4">
                <Volume2 className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-gray-800">Áudio Guiado Profissional</CardTitle>
              <CardDescription>
                Meditações narradas com voz suave e instruções claras para guiar sua prática
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-blue-100 hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-gray-800">10 Aulas Especializadas</CardTitle>
              <CardDescription>
                Técnicas para ansiedade, sono, foco, energia e muito mais
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-blue-100 hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-gray-800">Acompanhamento Completo</CardTitle>
              <CardDescription>
                Gráficos e estatísticas detalhadas do seu progresso e evolução
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-blue-100 hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4">
                <Moon className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-gray-800">Monitoramento de Sono</CardTitle>
              <CardDescription>
                Registre e acompanhe a qualidade do seu sono diariamente
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-blue-100 hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-gray-800">Lembretes Inteligentes</CardTitle>
              <CardDescription>
                Notificações personalizadas para manter sua rotina consistente
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-blue-100 hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mb-4">
                <Play className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-gray-800">Timer Personalizável</CardTitle>
              <CardDescription>
                Controle total sobre a duração das suas sessões de meditação
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="bg-white/50 backdrop-blur-sm py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Benefícios comprovados pela ciência
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Milhares de estudos confirmam os efeitos positivos da meditação regular
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Reduz Ansiedade e Estresse</h3>
                <p className="text-gray-600">
                  Diminui os níveis de cortisol e promove sensação de calma e bem-estar
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Melhora a Qualidade do Sono</h3>
                <p className="text-gray-600">
                  Ajuda a adormecer mais rápido e ter um sono mais profundo e reparador
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Aumenta Foco e Concentração</h3>
                <p className="text-gray-600">
                  Melhora a capacidade de atenção e produtividade no dia a dia
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Fortalece o Sistema Imunológico</h3>
                <p className="text-gray-600">
                  Reduz inflamações e fortalece as defesas naturais do corpo
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Desenvolve Inteligência Emocional</h3>
                <p className="text-gray-600">
                  Aumenta autoconsciência e capacidade de lidar com emoções
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Promove Bem-Estar Geral</h3>
                <p className="text-gray-600">
                  Aumenta sensação de felicidade e satisfação com a vida
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            O que nossos usuários dizem
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Histórias reais de transformação através da meditação
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-blue-100">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500" />
                <div>
                  <p className="font-bold text-gray-800">Maria Silva</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
              <CardDescription className="text-gray-600">
                "Sofria com ansiedade há anos. Depois de 2 semanas usando o app, já sinto uma diferença enorme. As aulas guiadas são perfeitas!"
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-blue-100">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500" />
                <div>
                  <p className="font-bold text-gray-800">João Santos</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
              <CardDescription className="text-gray-600">
                "Meu sono melhorou muito! Uso a meditação de sono profundo toda noite e acordo muito mais descansado. Recomendo demais!"
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-blue-100">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500" />
                <div>
                  <p className="font-bold text-gray-800">Ana Costa</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
              <CardDescription className="text-gray-600">
                "Aplicativo incrível! A variedade de aulas e o acompanhamento de progresso me motivam a meditar todos os dias. Mudou minha vida!"
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-white/50 backdrop-blur-sm py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Escolha seu plano
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Planos premium com acesso completo a todos os recursos
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Plano Premium */}
            <Card className="border-blue-400 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-400 to-cyan-500 text-white px-4 py-1 text-sm font-medium">
                Mais Popular
              </div>
              <CardHeader>
                <CardTitle className="text-2xl text-gray-800">Premium</CardTitle>
                <CardDescription>Acesso completo</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500">R$ 29,90</span>
                  <span className="text-gray-600">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">10 aulas especializadas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Áudio guiado profissional</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Monitoramento de sono</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Lembretes personalizados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Estatísticas avançadas</span>
                  </li>
                </ul>
                <Button
                  onClick={handleGetStarted}
                  className="w-full bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white"
                >
                  Começar Agora
                </Button>
              </CardContent>
            </Card>

            {/* Plano Anual */}
            <Card className="border-blue-100">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-800">Anual</CardTitle>
                <CardDescription>Economize 40%</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-800">R$ 179,90</span>
                  <span className="text-gray-600">/ano</span>
                </div>
                <p className="text-sm text-green-600 font-medium">R$ 14,99/mês</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Tudo do Premium</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Acesso antecipado a novos recursos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Suporte prioritário</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Economia de R$ 179/ano</span>
                  </li>
                </ul>
                <Button
                  onClick={handleGetStarted}
                  variant="outline"
                  className="w-full border-blue-200 hover:bg-blue-50"
                >
                  Começar Agora
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <Card className="bg-gradient-to-r from-blue-400 to-cyan-500 border-0 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <CardContent className="py-16 px-8 text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Comece sua jornada de transformação hoje
            </h2>
            <p className="text-lg mb-8 text-blue-50 max-w-2xl mx-auto">
              Junte-se a milhares de pessoas que já descobriram o poder da meditação para viver com mais paz, foco e bem-estar
            </p>
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6"
            >
              <Play className="w-5 h-5 mr-2" />
              Começar Agora
            </Button>
            <p className="text-sm text-blue-50 mt-4">
              Cancele quando quiser
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-blue-100 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center">
                <Moon className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-800">Serenidade</span>
            </div>
            <p className="text-sm text-gray-600">
              © 2024 Serenidade. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <button className="hover:text-gray-800">Privacidade</button>
              <button className="hover:text-gray-800">Termos</button>
              <button className="hover:text-gray-800">Contato</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
