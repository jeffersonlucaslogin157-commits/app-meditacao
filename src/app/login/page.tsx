"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { safeAuth, isSupabaseReady } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Moon, Mail, Lock, LogIn, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!isSupabaseReady()) {
        toast.error("Sistema de autenticação não disponível", {
          description: "Por favor, configure as credenciais do Supabase",
        });
        setLoading(false);
        return;
      }

      // Apenas LOGIN - sem cadastro
      const { data, error } = await safeAuth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Login realizado com sucesso! 🎉");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error("Erro no login", {
        description: "Verifique suas credenciais ou entre em contato com o suporte",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 flex items-center justify-center p-4">
      <Toaster />
      
      {/* Botão Voltar */}
      <Button
        onClick={() => router.push("/")}
        variant="ghost"
        className="absolute top-4 left-4 text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      <Card className="w-full max-w-md border-blue-100 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center">
              <Moon className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl text-gray-800">Serenidade</CardTitle>
            <CardDescription className="text-gray-600">
              Acesso exclusivo para assinantes
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-blue-200 focus:ring-blue-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">
                <Lock className="w-4 h-4 inline mr-2" />
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="border-blue-200 focus:ring-blue-400"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white"
            >
              {loading ? (
                "Carregando..."
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Entrar
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-gray-700 text-center font-medium mb-2">
              🔒 Acesso Restrito
            </p>
            <p className="text-xs text-gray-600 text-center">
              Apenas clientes que compraram o app podem fazer login. Use o email da sua compra na Kiwify.
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Ainda não comprou?{" "}
              <button
                onClick={() => router.push("/")}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Ver planos
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
