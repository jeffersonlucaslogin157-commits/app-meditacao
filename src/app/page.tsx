"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Moon, Sun, TrendingUp, BookOpen, Bell, Settings, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

// Tipos
interface MeditationSession {
  id: string;
  date: string;
  duration: number;
  theme: string;
}

interface SleepRecord {
  date: string;
  hours: number;
  quality: number;
}

interface UserPreferences {
  notificationsEnabled: boolean;
  notificationTime: string;
  darkMode: boolean;
}

// Aulas de meditação (agora com 10 aulas!)
const meditationClasses = [
  {
    id: "1",
    title: "Respiração Consciente",
    theme: "Ansiedade",
    description: "Acalme sua mente focando na respiração profunda e consciente.",
    duration: 5,
    content: `Encontre uma posição confortável. Feche os olhos suavemente.

Inspire profundamente pelo nariz, contando até 4.
Segure o ar por 4 segundos.
Expire lentamente pela boca, contando até 6.

Repita este ciclo, permitindo que cada respiração leve embora as tensões do dia.

Observe como seu corpo relaxa a cada expiração.
Não force nada, apenas observe o fluxo natural da sua respiração.

Quando pensamentos surgirem, gentilmente retorne sua atenção à respiração.`,
    color: "from-blue-400 to-cyan-500"
  },
  {
    id: "2",
    title: "Sono Profundo",
    theme: "Sono",
    description: "Prepare seu corpo e mente para uma noite de sono reparador.",
    duration: 10,
    content: `Deite-se confortavelmente em sua cama. Ajuste travesseiros e cobertores.

Comece relaxando os dedos dos pés, depois os pés, as pernas...
Sinta cada parte do corpo ficando pesada e relaxada.

Imagine uma onda de relaxamento subindo pelo seu corpo.
Dos pés até a cabeça, liberando toda tensão.

Sua respiração fica cada vez mais lenta e profunda.
Você está seguro, confortável e pronto para descansar.

Deixe sua mente flutuar suavemente em direção ao sono.`,
    color: "from-indigo-400 to-purple-500"
  },
  {
    id: "3",
    title: "Gratidão Matinal",
    theme: "Energia",
    description: "Comece o dia com energia positiva e gratidão.",
    duration: 7,
    content: `Sente-se confortavelmente. Respire fundo três vezes.

Pense em três coisas pelas quais você é grato hoje.
Pode ser algo simples: o sol, um sorriso, uma refeição.

Sinta a gratidão preenchendo seu coração.
Deixe essa sensação se expandir por todo seu corpo.

Visualize seu dia fluindo com leveza e positividade.
Você está pronto para aproveitar cada momento.

Abra os olhos quando estiver pronto, levando essa energia consigo.`,
    color: "from-amber-400 to-orange-500"
  },
  {
    id: "4",
    title: "Mindfulness no Presente",
    theme: "Foco",
    description: "Traga sua atenção para o momento presente com plena consciência.",
    duration: 15,
    content: `Sente-se em uma posição confortável. Coluna ereta, ombros relaxados.

Traga sua atenção para o momento presente.
Observe os sons ao seu redor, sem julgá-los.

Sinta o contato do seu corpo com a superfície onde está sentado.
Observe a temperatura do ar em sua pele.

Quando sua mente vagar para o passado ou futuro,
gentilmente a traga de volta para o agora.

Este momento é tudo que existe.
Aqui e agora, você está completo.`,
    color: "from-green-400 to-emerald-500"
  },
  {
    id: "5",
    title: "Liberação de Estresse",
    theme: "Relaxamento",
    description: "Libere tensões acumuladas e encontre paz interior.",
    duration: 12,
    content: `Feche os olhos e respire profundamente.

Escaneie seu corpo mentalmente, da cabeça aos pés.
Onde você sente tensão? Ombros? Mandíbula? Costas?

A cada expiração, imagine liberando essa tensão.
Visualize-a saindo do seu corpo como fumaça.

Seu corpo está ficando mais leve, mais solto.
Cada músculo relaxa profundamente.

Permita-se soltar o controle.
Você está seguro para relaxar completamente.

Quando estiver pronto, retorne suavemente, renovado.`,
    color: "from-teal-400 to-cyan-500"
  },
  {
    id: "6",
    title: "Caminhada Mental na Natureza",
    theme: "Paz Interior",
    description: "Visualize uma caminhada relaxante em um ambiente natural sereno.",
    duration: 8,
    content: `Feche os olhos e respire profundamente três vezes.

Imagine-se em uma trilha tranquila cercada por árvores.
O sol filtra suavemente através das folhas.

Sinta a brisa fresca tocando seu rosto.
Ouça o canto dos pássaros ao longe.

Cada passo que você dá é leve e sem pressa.
Você está completamente presente neste momento.

Observe as cores vibrantes da natureza ao seu redor.
Sinta a conexão profunda com tudo que existe.

Quando estiver pronto, traga essa paz de volta com você.`,
    color: "from-lime-400 to-green-500"
  },
  {
    id: "7",
    title: "Meditação da Compaixão",
    theme: "Amor Próprio",
    description: "Cultive compaixão por si mesmo e pelos outros.",
    duration: 10,
    content: `Sente-se confortavelmente e coloque uma mão sobre seu coração.

Respire profundamente e sinta o calor da sua mão.
Repita mentalmente: "Que eu seja feliz. Que eu seja saudável."

Agora pense em alguém que você ama.
Envie a essa pessoa os mesmos desejos de felicidade e saúde.

Expanda essa compaixão para pessoas neutras, depois para todos os seres.
Sinta seu coração se expandindo com amor universal.

Você é digno de amor e compaixão.
Todos os seres merecem paz e felicidade.

Retorne suavemente, levando essa compaixão consigo.`,
    color: "from-pink-400 to-rose-500"
  },
  {
    id: "8",
    title: "Meditação do Corpo Scan",
    theme: "Consciência Corporal",
    description: "Explore cada parte do seu corpo com atenção plena.",
    duration: 20,
    content: `Deite-se confortavelmente de costas, braços ao lado do corpo.

Comece trazendo atenção aos dedos dos pés.
Observe qualquer sensação - calor, frio, formigamento.

Mova sua atenção lentamente para os pés, tornozelos, panturrilhas.
Não julgue, apenas observe cada sensação.

Continue subindo: joelhos, coxas, quadris, abdômen.
Respire em cada área, liberando qualquer tensão.

Peito, ombros, braços, mãos, dedos.
Pescoço, mandíbula, rosto, topo da cabeça.

Sinta seu corpo inteiro como uma unidade completa.
Você está presente em cada célula do seu ser.

Descanse nesta consciência plena por alguns momentos.`,
    color: "from-violet-400 to-purple-500"
  },
  {
    id: "9",
    title: "Meditação para Criatividade",
    theme: "Inspiração",
    description: "Desbloqueie sua criatividade e conecte-se com sua imaginação.",
    duration: 12,
    content: `Sente-se confortavelmente e feche os olhos.

Respire profundamente e imagine uma luz dourada acima da sua cabeça.
Esta luz representa sua criatividade infinita.

A cada inspiração, essa luz desce e preenche sua mente.
Sinta ideias fluindo livremente, sem julgamento.

Visualize um espaço interno onde tudo é possível.
Não há limites, não há regras, apenas pura criação.

Permita que imagens, palavras ou sensações surjam naturalmente.
Observe-as com curiosidade e abertura.

Quando estiver pronto, agradeça por essa conexão criativa.
Saiba que você pode retornar a este espaço sempre que precisar.`,
    color: "from-yellow-400 to-amber-500"
  },
  {
    id: "10",
    title: "Meditação do Equilíbrio",
    theme: "Harmonia",
    description: "Encontre equilíbrio entre corpo, mente e espírito.",
    duration: 15,
    content: `Sente-se em uma posição estável, coluna ereta mas relaxada.

Imagine uma linha de energia subindo da base da sua coluna até o topo da cabeça.
Esta linha representa seu eixo central de equilíbrio.

Respire profundamente e sinta-se ancorado à terra.
Ao mesmo tempo, sinta-se leve e conectado ao céu.

Observe os opostos dentro de você: força e suavidade, ação e descanso.
Não há necessidade de escolher - ambos coexistem em harmonia.

Visualize uma balança perfeitamente equilibrada em seu coração.
Tudo em sua vida encontra seu lugar natural.

Confie no fluxo da vida.
Você está exatamente onde precisa estar.

Retorne suavemente, mantendo esse senso de equilíbrio.`,
    color: "from-sky-400 to-blue-500"
  }
];

export default function MeditationApp() {
  // Estados
  const [activeTab, setActiveTab] = useState("home");
  const [selectedClass, setSelectedClass] = useState<typeof meditationClasses[0] | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    notificationsEnabled: false,
    notificationTime: "20:00",
    darkMode: false
  });
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(3);

  // Estados para áudio
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioSupported, setIsAudioSupported] = useState(false);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Verificar suporte a Web Speech API
  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsAudioSupported(true);
    }
  }, []);

  // Carregar dados do localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem("meditationSessions");
    const savedSleep = localStorage.getItem("sleepRecords");
    const savedPreferences = localStorage.getItem("userPreferences");

    if (savedSessions) setSessions(JSON.parse(savedSessions));
    if (savedSleep) setSleepRecords(JSON.parse(savedSleep));
    if (savedPreferences) setPreferences(JSON.parse(savedPreferences));
  }, []);

  // Salvar dados no localStorage
  useEffect(() => {
    localStorage.setItem("meditationSessions", JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem("sleepRecords", JSON.stringify(sleepRecords));
  }, [sleepRecords]);

  useEffect(() => {
    localStorage.setItem("userPreferences", JSON.stringify(preferences));
  }, [preferences]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Notificações diárias
  useEffect(() => {
    if (preferences.notificationsEnabled && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }

      const checkNotification = () => {
        const now = new Date();
        const [hours, minutes] = preferences.notificationTime.split(":");
        if (now.getHours() === parseInt(hours) && now.getMinutes() === parseInt(minutes)) {
          if (Notification.permission === "granted") {
            new Notification("Hora de Meditar! 🧘‍♀️", {
              body: "Reserve alguns minutos para sua prática de meditação.",
              icon: "/icon.svg"
            });
          }
          toast.success("Hora de Meditar! 🧘‍♀️", {
            description: "Reserve alguns minutos para sua prática de meditação."
          });
        }
      };

      const interval = setInterval(checkNotification, 60000);
      return () => clearInterval(interval);
    }
  }, [preferences]);

  // Limpar áudio ao mudar de aula ou desmontar
  useEffect(() => {
    return () => {
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [selectedClass]);

  // Funções de áudio
  const playAudio = () => {
    if (!selectedClass || !isAudioSupported) return;

    // Cancelar qualquer áudio anterior
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(selectedClass.content);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0; // Velocidade normal (1x)
    utterance.pitch = 1.0; // Tom normal
    utterance.volume = 1.0; // Volume máximo

    utterance.onstart = () => {
      setIsAudioPlaying(true);
    };

    utterance.onend = () => {
      setIsAudioPlaying(false);
    };

    utterance.onerror = () => {
      setIsAudioPlaying(false);
      toast.error("Erro ao reproduzir áudio", {
        description: "Tente novamente ou verifique as configurações do navegador."
      });
    };

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const pauseAudio = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsAudioPlaying(false);
    }
  };

  const toggleAudio = () => {
    if (isAudioPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  // Funções
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startMeditation = (meditationClass: typeof meditationClasses[0]) => {
    setSelectedClass(meditationClass);
    setTimerSeconds(0);
    setIsTimerRunning(true);
    setActiveTab("timer");
    // Parar qualquer áudio anterior
    if (isAudioPlaying) {
      pauseAudio();
    }
  };

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
    if (isAudioPlaying) {
      pauseAudio();
    }
  };

  const finishSession = () => {
    if (timerSeconds > 0 && selectedClass) {
      const newSession: MeditationSession = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        duration: timerSeconds,
        theme: selectedClass.theme
      };
      setSessions([newSession, ...sessions]);
      toast.success("Sessão concluída! 🎉", {
        description: `Você meditou por ${formatTime(timerSeconds)}`
      });
      resetTimer();
      setSelectedClass(null);
      setActiveTab("progress");
    }
  };

  const addSleepRecord = () => {
    const newRecord: SleepRecord = {
      date: new Date().toISOString().split("T")[0],
      hours: sleepHours,
      quality: sleepQuality
    };
    setSleepRecords([newRecord, ...sleepRecords.filter(r => r.date !== newRecord.date)]);
    toast.success("Registro de sono salvo! 😴");
  };

  // Dados para gráficos
  const last7DaysMeditation = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split("T")[0];
    const daySessions = sessions.filter(s => s.date.startsWith(dateStr));
    const totalMinutes = daySessions.reduce((acc, s) => acc + s.duration, 0) / 60;
    return {
      date: date.toLocaleDateString("pt-BR", { weekday: "short" }),
      minutes: Math.round(totalMinutes)
    };
  });

  const last7DaysSleep = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split("T")[0];
    const record = sleepRecords.find(r => r.date === dateStr);
    return {
      date: date.toLocaleDateString("pt-BR", { weekday: "short" }),
      hours: record?.hours || 0,
      quality: record?.quality || 0
    };
  });

  const totalMeditationTime = sessions.reduce((acc, s) => acc + s.duration, 0);
  const totalSessions = sessions.length;
  const averageSleep = sleepRecords.length > 0
    ? sleepRecords.reduce((acc, r) => acc + r.hours, 0) / sleepRecords.length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center">
                <Moon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Serenidade</h1>
                <p className="text-xs text-gray-500">Seu guia de meditação</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveTab("settings")}
              className="text-gray-600 hover:text-gray-800"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="home" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-400 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
              <BookOpen className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Aulas</span>
            </TabsTrigger>
            <TabsTrigger value="timer" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-400 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
              <Play className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Timer</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-400 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Progresso</span>
            </TabsTrigger>
            <TabsTrigger value="sleep" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-400 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
              <Moon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Sono</span>
            </TabsTrigger>
          </TabsList>

          {/* Aulas de Meditação */}
          <TabsContent value="home" className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Escolha sua Prática</h2>
              <p className="text-gray-600">Selecione uma aula de meditação guiada</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {meditationClasses.map((meditationClass) => (
                <Card key={meditationClass.id} className="overflow-hidden hover:shadow-lg transition-shadow border-blue-100">
                  <div className={`h-2 bg-gradient-to-r ${meditationClass.color}`} />
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg text-gray-800">{meditationClass.title}</CardTitle>
                        <CardDescription className="text-sm">{meditationClass.theme}</CardDescription>
                      </div>
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        {meditationClass.duration} min
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{meditationClass.description}</p>
                    <Button
                      onClick={() => startMeditation(meditationClass)}
                      className="w-full bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Iniciar Prática
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Timer de Meditação */}
          <TabsContent value="timer" className="space-y-6">
            <Card className="border-blue-100">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-gray-800">
                  {selectedClass ? selectedClass.title : "Meditação Livre"}
                </CardTitle>
                {selectedClass && (
                  <CardDescription>{selectedClass.theme}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Timer Display */}
                <div className="text-center">
                  <div className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400 mb-4">
                    {formatTime(timerSeconds)}
                  </div>
                  {selectedClass && (
                    <Progress 
                      value={(timerSeconds / (selectedClass.duration * 60)) * 100} 
                      className="h-2 mb-4"
                    />
                  )}
                </div>

                {/* Controles de Áudio */}
                {selectedClass && isAudioSupported && (
                  <div className="flex justify-center mb-4">
                    <Button
                      onClick={toggleAudio}
                      variant="outline"
                      size="lg"
                      className={`border-blue-200 ${isAudioPlaying ? 'bg-blue-50' : ''}`}
                    >
                      {isAudioPlaying ? (
                        <>
                          <VolumeX className="w-5 h-5 mr-2" />
                          Parar Áudio
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-5 h-5 mr-2" />
                          Ouvir Guia
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Conteúdo da Aula */}
                {selectedClass && (
                  <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                    <CardContent className="pt-6">
                      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                        {selectedClass.content}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Controles do Timer */}
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={toggleTimer}
                    size="lg"
                    className="bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white"
                  >
                    {isTimerRunning ? (
                      <>
                        <Pause className="w-5 h-5 mr-2" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        Iniciar
                      </>
                    )}
                  </Button>
                  <Button onClick={resetTimer} variant="outline" size="lg" className="border-blue-200">
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Reiniciar
                  </Button>
                  {timerSeconds > 0 && (
                    <Button
                      onClick={finishSession}
                      size="lg"
                      className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white"
                    >
                      Concluir
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progresso */}
          <TabsContent value="progress" className="space-y-6">
            {/* Estatísticas */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-blue-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total de Sessões</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500">
                    {totalSessions}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">sessões completas</p>
                </CardContent>
              </Card>

              <Card className="border-blue-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Tempo Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                    {Math.round(totalMeditationTime / 60)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">minutos meditados</p>
                </CardContent>
              </Card>

              <Card className="border-blue-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Média de Sono</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
                    {averageSleep.toFixed(1)}h
                  </div>
                  <p className="text-xs text-gray-500 mt-1">por noite</p>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Meditação */}
            <Card className="border-blue-100">
              <CardHeader>
                <CardTitle className="text-gray-800">Meditação - Últimos 7 Dias</CardTitle>
                <CardDescription>Minutos meditados por dia</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={last7DaysMeditation}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                    <XAxis dataKey="date" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "white", 
                        border: "1px solid #bae6fd",
                        borderRadius: "8px"
                      }}
                    />
                    <Bar dataKey="minutes" fill="url(#colorMeditation)" radius={[8, 8, 0, 0]} />
                    <defs>
                      <linearGradient id="colorMeditation" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#22d3ee" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Histórico de Sessões */}
            <Card className="border-blue-100">
              <CardHeader>
                <CardTitle className="text-gray-800">Histórico Recente</CardTitle>
                <CardDescription>Suas últimas sessões de meditação</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                      <div>
                        <p className="font-medium text-gray-800">{session.theme}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(session.date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">{formatTime(session.duration)}</p>
                        <p className="text-xs text-gray-500">duração</p>
                      </div>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      Nenhuma sessão registrada ainda. Comece sua jornada! 🧘‍♀️
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sono */}
          <TabsContent value="sleep" className="space-y-6">
            {/* Registrar Sono */}
            <Card className="border-blue-100">
              <CardHeader>
                <CardTitle className="text-gray-800">Registrar Sono de Hoje</CardTitle>
                <CardDescription>Acompanhe a qualidade do seu sono</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-gray-700">Horas dormidas: {sleepHours}h</Label>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="0.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-gray-700">Qualidade do sono: {sleepQuality}/5</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        onClick={() => setSleepQuality(value)}
                        className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                          sleepQuality >= value
                            ? "bg-gradient-to-r from-blue-400 to-cyan-500 text-white"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={addSleepRecord}
                  className="w-full bg-gradient-to-r from-indigo-400 to-purple-500 hover:from-indigo-500 hover:to-purple-600 text-white"
                >
                  <Moon className="w-4 h-4 mr-2" />
                  Salvar Registro
                </Button>
              </CardContent>
            </Card>

            {/* Gráfico de Sono */}
            <Card className="border-blue-100">
              <CardHeader>
                <CardTitle className="text-gray-800">Sono - Últimos 7 Dias</CardTitle>
                <CardDescription>Horas dormidas por noite</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={last7DaysSleep}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                    <XAxis dataKey="date" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "white", 
                        border: "1px solid #c7d2fe",
                        borderRadius: "8px"
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="hours" 
                      stroke="#818cf8" 
                      strokeWidth={3}
                      dot={{ fill: "#818cf8", r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Histórico de Sono */}
            <Card className="border-blue-100">
              <CardHeader>
                <CardTitle className="text-gray-800">Histórico de Sono</CardTitle>
                <CardDescription>Seus registros recentes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sleepRecords.slice(0, 7).map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                      <div>
                        <p className="font-medium text-gray-800">
                          {new Date(record.date).toLocaleDateString("pt-BR", { 
                            weekday: "long", 
                            day: "numeric", 
                            month: "long" 
                          })}
                        </p>
                        <p className="text-xs text-gray-500">Qualidade: {record.quality}/5</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-indigo-600">{record.hours}h</p>
                        <p className="text-xs text-gray-500">dormidas</p>
                      </div>
                    </div>
                  ))}
                  {sleepRecords.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      Nenhum registro de sono ainda. Comece a acompanhar! 😴
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="border-blue-100">
              <CardHeader>
                <CardTitle className="text-gray-800">Notificações</CardTitle>
                <CardDescription>Configure lembretes para suas práticas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-700">Notificações Diárias</Label>
                    <p className="text-sm text-gray-500">Receba lembretes para meditar</p>
                  </div>
                  <Switch
                    checked={preferences.notificationsEnabled}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, notificationsEnabled: checked })
                    }
                  />
                </div>

                {preferences.notificationsEnabled && (
                  <div className="space-y-2">
                    <Label className="text-gray-700">Horário do Lembrete</Label>
                    <input
                      type="time"
                      value={preferences.notificationTime}
                      onChange={(e) =>
                        setPreferences({ ...preferences, notificationTime: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-blue-100">
              <CardHeader>
                <CardTitle className="text-gray-800">Sobre o App</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-gray-600">
                  <Volume2 className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-medium">Áudio Guiado</p>
                    <p className="text-sm text-gray-500">Narração em velocidade normal (1x)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Bell className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-medium">Lembretes Inteligentes</p>
                    <p className="text-sm text-gray-500">Notificações personalizadas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="font-medium">Acompanhamento Completo</p>
                    <p className="text-sm text-gray-500">Gráficos e estatísticas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Moon className="w-5 h-5 text-indigo-400" />
                  <div>
                    <p className="font-medium">Monitoramento de Sono</p>
                    <p className="text-sm text-gray-500">Melhore sua qualidade de vida</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
