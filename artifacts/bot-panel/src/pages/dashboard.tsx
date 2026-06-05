import { useEffect, useRef } from "react";
import { useGetBotStatus, useGetBotStats, useGetBotLogs, useStartBot, useStopBot, useRestartBot } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Square, RotateCw, Activity, Server, Clock, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  const logsEndRef = useRef<HTMLDivElement>(null);

  const { data: status, isLoading: statusLoading } = useGetBotStatus({ query: { refetchInterval: 3000 } });
  const { data: stats } = useGetBotStats({ query: { refetchInterval: 10000 } });
  const { data: logsData } = useGetBotLogs({ limit: 30 }, { query: { refetchInterval: 2000 } });

  const startBot = useStartBot();
  const stopBot = useStopBot();
  const restartBot = useRestartBot();

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollTop = logsEndRef.current.scrollHeight;
    }
  }, [logsData?.logs]);

  const handleAction = (action: any, name: string) => {
    action.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Command Executed",
          description: `${name} sequence initiated.`,
          className: "bg-background border-primary text-primary font-mono",
        });
      },
      onError: (err: any) => {
        toast({
          title: "Command Failed",
          description: err.message || "An error occurred",
          variant: "destructive",
          className: "font-mono",
        });
      }
    });
  };

  const isWorking = startBot.isPending || stopBot.isPending || restartBot.isPending;

  const getStatusColor = (state?: string) => {
    switch (state) {
      case 'running':
      case 'connected': return "text-primary border-primary shadow-[0_0_20px_rgba(0,255,157,0.4)]";
      case 'stopped':
      case 'disconnected': return "text-muted-foreground border-muted";
      case 'error': return "text-destructive border-destructive shadow-[0_0_20px_rgba(255,0,0,0.4)]";
      case 'starting': return "text-yellow-400 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)]";
      default: return "text-muted-foreground border-muted";
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-primary';
      case 'debug': return 'text-gray-500';
      default: return 'text-foreground';
    }
  };

  const formatUptime = (seconds: number | null | undefined) => {
    if (!seconds) return "00:00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">SYSTEM_STATUS</h2>
        <p className="text-muted-foreground mt-1">Real-time overview of bot operations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Status Card */}
        <Card className="md:col-span-2 border-border bg-card/50 backdrop-blur">
          <CardContent className="p-8 flex flex-col items-center justify-center min-h-[260px] relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,157,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,157,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
            <AnimatePresence mode="wait">
              {statusLoading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="text-xl animate-pulse">ESTABLISHING_LINK...</div>
                </motion.div>
              ) : (
                <motion.div
                  key="status"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`flex flex-col items-center justify-center p-10 rounded-full border-4 ${getStatusColor(status?.state)}`}
                >
                  <div className="text-sm font-bold tracking-widest uppercase opacity-70 mb-2">CURRENT STATE</div>
                  <div className={`text-5xl font-black uppercase tracking-tighter ${(status?.state === 'starting' || status?.state === 'connecting') ? 'animate-pulse' : ''}`}>
                    {status?.state?.toUpperCase() || 'UNKNOWN'}
                  </div>
                  {status?.botName && (
                    <div className="mt-4 px-4 py-1 border border-current rounded-full text-xs font-bold">
                      ID: {status.botName}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Actions & Info */}
        <div className="space-y-4">
          <Card className="border-border bg-card/50">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs text-primary tracking-widest">EXECUTE_COMMAND</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-4">
              <Button
                className="w-full justify-start font-bold uppercase tracking-wider text-xs"
                variant="outline"
                disabled={isWorking || status?.state === 'running' || status?.state === 'connected'}
                onClick={() => handleAction(startBot, "START")}
                data-testid="btn-start"
              >
                <Play className="mr-2 h-3 w-3" /> Initialize
              </Button>
              <Button
                className="w-full justify-start font-bold uppercase tracking-wider text-xs hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                variant="outline"
                disabled={isWorking || status?.state === 'stopped'}
                onClick={() => handleAction(stopBot, "STOP")}
                data-testid="btn-stop"
              >
                <Square className="mr-2 h-3 w-3" /> Terminate
              </Button>
              <Button
                className="w-full justify-start font-bold uppercase tracking-wider text-xs hover:bg-yellow-500/20 hover:border-yellow-500 hover:text-yellow-400"
                variant="outline"
                disabled={isWorking}
                onClick={() => handleAction(restartBot, "RESTART")}
                data-testid="btn-restart"
              >
                <RotateCw className="mr-2 h-3 w-3" /> Reboot
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <div className="flex items-center text-muted-foreground text-xs">
                  <Clock className="w-3 h-3 mr-2" /> Uptime
                </div>
                <div className="font-bold text-primary text-sm font-mono">{formatUptime(status?.uptime)}</div>
              </div>
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <div className="flex items-center text-muted-foreground text-xs">
                  <Activity className="w-3 h-3 mr-2" /> Restarts
                </div>
                <div className="font-bold text-sm">{stats?.totalRestarts ?? status?.restartCount ?? 0}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-muted-foreground text-xs">
                  <Server className="w-3 h-3 mr-2" /> Engine
                </div>
                <div className="font-bold text-xs bg-secondary px-2 py-1 rounded font-mono">Node {status?.nodeVersion ?? '?'}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Live Terminal Output */}
      <Card className="border-border bg-[#050505]">
        <div className="flex items-center px-4 py-2 border-b border-border/30 bg-[#0a0a0a]">
          <Terminal className="w-4 h-4 mr-2 text-primary" />
          <span className="text-xs font-bold text-primary tracking-widest uppercase">LIVE_TERMINAL</span>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse inline-block"></span>
            STREAMING
          </div>
        </div>
        <div
          ref={logsEndRef}
          className="h-48 overflow-y-auto p-3 font-mono text-xs space-y-0.5"
        >
          {!logsData?.logs?.length ? (
            <div className="text-muted-foreground italic">Waiting for bot output... Start the bot to see logs here.</div>
          ) : (
            logsData.logs.map((log, i) => (
              <div key={i} className="flex gap-3 hover:bg-white/5 px-1 rounded leading-5">
                <span className="text-muted-foreground/50 shrink-0 tabular-nums">
                  {new Date(log.timestamp).toLocaleTimeString(undefined, { hour12: false })}
                </span>
                <span className={`shrink-0 w-10 font-bold ${getLogColor(log.level)} uppercase text-[10px] leading-5`}>
                  [{log.level.slice(0,3)}]
                </span>
                <span className={`${getLogColor(log.level)} opacity-85 break-all`}>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
