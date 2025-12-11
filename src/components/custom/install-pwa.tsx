"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Verificar se já está instalado
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowInstallBanner(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("Usuário aceitou instalar o app");
    } else {
      console.log("Usuário recusou instalar o app");
    }

    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-gradient-to-r from-purple-600 to-violet-600 rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="bg-white/20 p-2 rounded-xl">
            <Download className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-sm">
              Instalar Serenidade
            </h3>
            <p className="text-white/80 text-xs">
              Adicione à tela inicial para acesso rápido
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="bg-white text-purple-600 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-white/90 transition-all"
          >
            Instalar
          </button>
          <button
            onClick={() => setShowInstallBanner(false)}
            className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-all"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
