import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FolderOpen, Trash2, RefreshCw, HardDrive, FolderX, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SessionDir {
  name: string;
  exists: boolean;
  sizeMB: number;
  files: number;
  path: string;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Files() {
  const { toast } = useToast();
  const [dirs, setDirs] = useState<SessionDir[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingDir, setDeletingDir] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/bot/files`);
      const data = await r.json();
      setDirs(data.dirs || []);
    } catch (e) {
      toast({ title: "Erro", description: "Não foi possível carregar os arquivos.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFiles(); }, []);

  const deleteDir = async (name: string) => {
    setDeletingDir(name);
    try {
      const r = await fetch(`${BASE}/api/bot/reset`, { method: "POST" });
      const data = await r.json();
      if (data.success) {
        toast({ title: "Sessão Apagada", description: `Pasta ${name} removida com sucesso.`, className: "bg-background border-primary text-primary font-mono" });
        await fetchFiles();
      } else {
        throw new Error(data.message);
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha ao apagar.", variant: "destructive" });
    } finally {
      setDeletingDir(null);
    }
  };

  const resetAndNewQR = async () => {
    setResetting(true);
    try {
      const r = await fetch(`${BASE}/api/bot/reset-qr`, { method: "POST" });
      const data = await r.json();
      if (data.success) {
        toast({ title: "QR Resetado", description: "Sessão apagada e bot reiniciado. Vá para Conectar para escanear.", className: "bg-background border-primary text-primary font-mono" });
        await fetchFiles();
      } else {
        throw new Error(data.message);
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha ao resetar.", variant: "destructive" });
    } finally {
      setResetting(false);
    }
  };

  const totalMB = dirs.reduce((a, d) => a + d.sizeMB, 0);
  const totalFiles = dirs.reduce((a, d) => a + d.files, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">ARQUIVOS_BOT</h2>
          <p className="text-muted-foreground mt-1">Gerencie os arquivos de sessão do WhatsApp.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchFiles} disabled={loading} className="font-mono text-xs uppercase tracking-wider">
            <RefreshCw className={`w-3 h-3 mr-2 ${loading ? "animate-spin" : ""}`} /> Atualizar
          </Button>
          <Button
            size="sm"
            onClick={resetAndNewQR}
            disabled={resetting}
            className="font-mono text-xs uppercase tracking-wider bg-primary/20 border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <RefreshCw className={`w-3 h-3 mr-2 ${resetting ? "animate-spin" : ""}`} />
            {resetting ? "Resetando..." : "Apagar Sessão + Novo QR"}
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "PASTAS", value: dirs.filter(d => d.exists).length + "/" + dirs.length },
          { label: "ARQUIVOS", value: totalFiles },
          { label: "TAMANHO", value: totalMB > 0 ? totalMB.toFixed(1) + " MB" : "0 MB" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-xs text-muted-foreground tracking-widest uppercase">{stat.label}</div>
              <div className="text-2xl font-bold text-primary mt-1">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Directory List */}
      <Card className="border-border bg-card/50">
        <CardHeader>
          <CardTitle className="text-sm text-primary tracking-widest uppercase flex items-center gap-2">
            <HardDrive className="w-4 h-4" /> Diretórios de Sessão
          </CardTitle>
          <CardDescription>Apagar a pasta GataBotSession força um novo QR Code na próxima inicialização.</CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground animate-pulse">Carregando arquivos...</div>
            ) : dirs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Nenhuma pasta encontrada.</div>
            ) : (
              <div className="space-y-3">
                {dirs.map((dir) => (
                  <motion.div
                    key={dir.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      dir.exists
                        ? dir.name === "GataBotSession"
                          ? "border-primary/40 bg-primary/5"
                          : "border-border bg-background/40"
                        : "border-border/30 bg-background/20 opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {dir.exists ? (
                        <FolderOpen className={`w-5 h-5 ${dir.name === "GataBotSession" ? "text-primary" : "text-muted-foreground"}`} />
                      ) : (
                        <FolderX className="w-5 h-5 text-muted-foreground/40" />
                      )}
                      <div>
                        <div className={`font-bold font-mono text-sm ${dir.exists ? "text-foreground" : "text-muted-foreground/50"}`}>
                          {dir.name}
                          {dir.name === "GataBotSession" && (
                            <span className="ml-2 text-[10px] text-primary/70 border border-primary/30 rounded px-1 py-0.5">SESSÃO PRINCIPAL</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {dir.exists ? `${dir.files} arquivo${dir.files !== 1 ? "s" : ""} · ${dir.sizeMB.toFixed(2)} MB` : "Não existe"}
                        </div>
                      </div>
                    </div>
                    {dir.exists ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs font-mono uppercase tracking-wider border-destructive/50 text-destructive hover:bg-destructive hover:text-white"
                        disabled={deletingDir === dir.name || resetting}
                        onClick={() => deleteDir(dir.name)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        {deletingDir === dir.name ? "Apagando..." : "Apagar"}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground/40 font-mono">VAZIO</span>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Warning */}
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-300/80 space-y-1">
            <p className="font-bold text-yellow-300">⚠️ Zona de Atenção</p>
            <p>Apagar <span className="font-mono text-yellow-200">GataBotSession</span> desvincula o WhatsApp — você precisará escanear um novo QR Code para reconectar.</p>
            <p>Use <strong>"Apagar Sessão + Novo QR"</strong> para fazer isso automaticamente.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
