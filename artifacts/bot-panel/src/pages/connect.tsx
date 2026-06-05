import { useEffect, useRef } from "react";
import { useGetBotStatus, useStartBot, useRequestPairingCode } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Lock, RefreshCw, Smartphone, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Connect() {
  const { toast } = useToast();
  const prevQr = useRef<string | null>(null);

  const { data: status, refetch } = useGetBotStatus({ query: { refetchInterval: 2000 } });
  const startBot = useStartBot();

  const isConnected = status?.state === "connected";
  const isRunning = status?.state === "running" || status?.state === "starting";
  const isStopped = status?.state === "stopped";
  const qrCode = status?.qrCode;

  // Notify when a new QR code arrives
  useEffect(() => {
    if (qrCode && qrCode !== prevQr.current) {
      prevQr.current = qrCode;
      toast({
        title: "QR Code Atualizado",
        description: "Novo QR Code disponível — escaneie agora no WhatsApp.",
        className: "bg-background border-primary text-primary font-mono",
      });
    }
  }, [qrCode]);

  const handleStart = () => {
    startBot.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Bot Iniciado", description: "Aguarde o QR code aparecer abaixo.", className: "bg-background border-primary text-primary font-mono" });
        setTimeout(() => refetch(), 3000);
      },
      onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">CONEXÃO_WHATSAPP</h2>
        <p className="text-muted-foreground mt-1">Escaneie o QR Code para vincular o bot ao seu WhatsApp.</p>
      </div>

      <AnimatePresence mode="wait">
        {isConnected ? (
          <motion.div key="connected" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-primary bg-primary/10">
              <CardContent className="p-12 text-center flex flex-col items-center">
                <Lock className="w-16 h-16 text-primary mb-4" />
                <h3 className="text-2xl font-bold text-primary uppercase tracking-widest">LINK ESTABELECIDO</h3>
                <p className="text-primary/80 mt-2 font-mono">
                  {status?.phoneNumber ? `Vinculado: +${status.phoneNumber}` : "WhatsApp conectado com sucesso."}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="disconnected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Instructions */}
            <Card className="border-border/50 bg-card/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="font-bold text-foreground">Como conectar via QR Code:</p>
                    <p>1. Abra o WhatsApp no seu celular</p>
                    <p>2. Vá em <span className="text-primary font-mono">Configurações → Dispositivos Vinculados → Vincular dispositivo</span></p>
                    <p>3. Aponte a câmera para o QR Code abaixo</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* QR Code Card */}
            <Card className="border-border bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <QrCode className="w-5 h-5" /> QR_CODE
                </CardTitle>
                <CardDescription>
                  {isStopped
                    ? "Inicie o bot primeiro para gerar o QR Code."
                    : qrCode
                    ? "QR Code pronto — escaneie agora. Expira em ~60s."
                    : "Aguardando geração do QR Code..."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6 pb-8">
                <AnimatePresence mode="wait">
                  {isStopped ? (
                    <motion.div key="stopped" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
                      <div className="w-64 h-64 border border-dashed border-border rounded-lg flex items-center justify-center flex-col text-muted-foreground">
                        <QrCode className="w-12 h-12 mb-3 opacity-30" />
                        <span className="text-sm text-center px-4">Bot parado. Inicie o bot para gerar o QR Code.</span>
                      </div>
                      <Button
                        onClick={handleStart}
                        disabled={startBot.isPending}
                        className="font-bold uppercase tracking-wider"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${startBot.isPending ? "animate-spin" : ""}`} />
                        Iniciar Bot
                      </Button>
                    </motion.div>
                  ) : qrCode ? (
                    <motion.div key="qr" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-white rounded-xl shadow-[0_0_30px_rgba(0,255,157,0.2)]">
                        <img src={qrCode} alt="QR Code WhatsApp" className="w-64 h-64 object-contain" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-primary/70">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse inline-block" />
                        QR code atualiza automaticamente
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-64 h-64 border border-dashed border-primary/30 rounded-lg flex items-center justify-center flex-col text-muted-foreground">
                      <RefreshCw className="w-10 h-10 mb-3 text-primary/50 animate-spin" style={{ animationDuration: "3s" }} />
                      <span className="text-sm text-center px-4">Gerando QR Code...</span>
                      <span className="text-xs mt-1 opacity-50">Pode levar alguns segundos</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isStopped && (
                  <div className="w-full max-w-xs flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
                    <p className="text-xs text-yellow-300/80">
                      Não feche esta página enquanto escaneia. Se o QR expirar, ele será atualizado automaticamente.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
