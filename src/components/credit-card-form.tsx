"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Lock } from "lucide-react";

interface CreditCardFormProps {
  onSubmit: (cardData: CreditCardData) => void;
  loading?: boolean;
}

export interface CreditCardData {
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvv: string;
}

export function CreditCardForm({ onSubmit, loading = false }: CreditCardFormProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  // Formatar número do cartão (XXXX XXXX XXXX XXXX)
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "").replace(/\D/g, "");
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
    return formatted.substring(0, 19); // 16 dígitos + 3 espaços
  };

  // Formatar data de expiração (MM/AA)
  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };

  // Formatar CVV (apenas números)
  const formatCVV = (value: string) => {
    return value.replace(/\D/g, "").substring(0, 4);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    const cleanCardNumber = cardNumber.replace(/\s/g, "");
    if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      alert("Número do cartão inválido");
      return;
    }

    if (!cardName.trim()) {
      alert("Nome do titular é obrigatório");
      return;
    }

    const [month, year] = expiryDate.split("/");
    if (!month || !year || parseInt(month) < 1 || parseInt(month) > 12) {
      alert("Data de validade inválida");
      return;
    }

    if (cvv.length < 3 || cvv.length > 4) {
      alert("CVV inválido");
      return;
    }

    onSubmit({
      cardNumber: cleanCardNumber,
      cardName: cardName.trim(),
      expiryDate,
      cvv,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Número do Cartão */}
      <div className="space-y-2">
        <Label htmlFor="cardNumber">Número do Cartão</Label>
        <div className="relative">
          <Input
            id="cardNumber"
            type="text"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            className="pl-10"
            disabled={loading}
            required
          />
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Nome no Cartão */}
      <div className="space-y-2">
        <Label htmlFor="cardName">Nome no Cartão</Label>
        <Input
          id="cardName"
          type="text"
          placeholder="NOME COMO ESTÁ NO CARTÃO"
          value={cardName}
          onChange={(e) => setCardName(e.target.value.toUpperCase())}
          disabled={loading}
          required
        />
      </div>

      {/* Data de Validade e CVV */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expiryDate">Validade</Label>
          <Input
            id="expiryDate"
            type="text"
            placeholder="MM/AA"
            value={expiryDate}
            onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
            disabled={loading}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cvv">CVV</Label>
          <div className="relative">
            <Input
              id="cvv"
              type="text"
              placeholder="123"
              value={cvv}
              onChange={(e) => setCvv(formatCVV(e.target.value))}
              className="pl-10"
              disabled={loading}
              required
            />
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Informação de Segurança */}
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
        <Lock className="w-4 h-4 text-blue-600" />
        <span>Seus dados estão protegidos com criptografia de ponta a ponta</span>
      </div>

      {/* Botão de Submissão */}
      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white"
        disabled={loading}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Processando...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Pagar com Cartão
          </>
        )}
      </Button>
    </form>
  );
}
