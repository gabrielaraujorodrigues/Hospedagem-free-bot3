import { useEffect, useRef } from "react";
import { useGetBotLogs } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Terminal as TerminalIcon } from "lucide-react";

export default function Logs() {
  const { data } = useGetBotLogs({ limit: 500 }, { query: { refetchInterval: 3000 } });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data?.logs]);

  const getLogColor = (level: string) => {
    switch(level) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-primary';
      case 'debug': return 'text-gray-500';
      default: return 'text-foreground';
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
          <TerminalIcon className="w-8 h-8" />
          TERMINAL_OUT
        </h2>
        <p className="text-muted-foreground mt-1">Live data stream from server core.</p>
      </div>

      <Card className="flex-1 border-border bg-[#050505] overflow-hidden flex flex-col relative shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
        <div className="flex items-center px-4 py-2 border-b border-border/30 bg-[#0a0a0a] text-xs font-bold text-muted-foreground uppercase tracking-widest">
          <span>/var/log/bot.log</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            LIVE
          </div>
        </div>
        
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1 log-scroll"
        >
          {!data?.logs?.length ? (
            <div className="text-muted-foreground italic">No logs available...</div>
          ) : (
            data.logs.map((log, i) => (
              <div key={i} className="flex gap-4 hover:bg-white/5 px-1 rounded break-all">
                <span className="text-muted-foreground shrink-0 opacity-50">
                  {new Date(log.timestamp).toLocaleTimeString(undefined, { hour12: false, fractionalSecondDigits: 3 })}
                </span>
                <span className={`shrink-0 w-12 font-bold ${getLogColor(log.level)} uppercase`}>
                  [{log.level}]
                </span>
                <span className={`${getLogColor(log.level)} opacity-90`}>
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
