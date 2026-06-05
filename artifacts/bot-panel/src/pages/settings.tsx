import { useGetAutoRestart, useSetAutoRestart, useGetNodeInfo, useResetBotSession } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Power, ServerCog } from "lucide-react";
import { useState, useEffect } from "react";

export default function Settings() {
  const { toast } = useToast();
  
  const { data: autoRestartData } = useGetAutoRestart();
  const setAutoRestart = useSetAutoRestart();
  
  const { data: nodeInfo } = useGetNodeInfo();
  
  const resetSession = useResetBotSession();

  const [autoRestartEnabled, setAutoRestartEnabled] = useState(false);
  const [delaySeconds, setDelaySeconds] = useState(5);

  useEffect(() => {
    if (autoRestartData) {
      setAutoRestartEnabled(autoRestartData.enabled);
      if (autoRestartData.delaySeconds) {
        setDelaySeconds(autoRestartData.delaySeconds);
      }
    }
  }, [autoRestartData]);

  const handleSaveAutoRestart = () => {
    setAutoRestart.mutate(
      { data: { enabled: autoRestartEnabled, delaySeconds } },
      {
        onSuccess: () => {
          toast({
            title: "Config Updated",
            description: "Auto-restart protocol modified.",
            className: "border-primary text-primary bg-background font-mono"
          });
        },
        onError: (err: any) => {
          toast({
            title: "Error",
            description: err.message,
            variant: "destructive"
          });
        }
      }
    );
  };

  const handleResetSession = () => {
    if (confirm("CRITICAL WARNING: This will destroy the current WhatsApp session. You will need to re-authenticate. Proceed?")) {
      resetSession.mutate(undefined, {
        onSuccess: () => {
          toast({
            title: "Session Purged",
            description: "Bot session has been reset.",
            className: "border-destructive text-destructive bg-background font-mono"
          });
        },
        onError: (err: any) => {
          toast({
            title: "Purge Failed",
            description: err.message,
            variant: "destructive"
          });
        }
      });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">SYS_CONFIG</h2>
        <p className="text-muted-foreground mt-1">Core system parameters and maintenance operations.</p>
      </div>

      <Card className="border-border bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Power className="w-5 h-5" /> AUTO_RECOVERY
          </CardTitle>
          <CardDescription className="text-muted-foreground">Automatically reboot server on crash.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/50 pb-6">
            <div className="space-y-0.5">
              <Label className="text-base font-bold uppercase tracking-wider text-foreground">Enable Recovery</Label>
              <p className="text-sm text-muted-foreground">Keep the bot alive 24/7</p>
            </div>
            <Switch 
              checked={autoRestartEnabled} 
              onCheckedChange={setAutoRestartEnabled} 
              className="data-[state=checked]:bg-primary"
            />
          </div>
          
          <div className="flex items-end gap-4">
            <div className="space-y-2 flex-1">
              <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Delay (Seconds)</Label>
              <Input 
                type="number" 
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(Number(e.target.value))}
                min={1}
                max={60}
                className="font-mono bg-background border-border focus-visible:ring-primary"
              />
            </div>
            <Button 
              onClick={handleSaveAutoRestart}
              disabled={setAutoRestart.isPending}
              className="font-bold uppercase tracking-wider"
            >
              Apply Config
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <ServerCog className="w-5 h-5" /> ENGINE_INFO
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-background border border-border rounded font-mono text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">CURRENT_VERSION</span>
              <span className="text-primary font-bold">{nodeInfo?.current || 'Scanning...'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" /> DANGER_ZONE
          </CardTitle>
          <CardDescription className="text-destructive/70">Irreversible destructive operations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-destructive/30 bg-destructive/10 rounded-lg">
            <div>
              <h4 className="font-bold text-destructive uppercase tracking-wider">Purge Session</h4>
              <p className="text-sm text-destructive/70 mt-1">Deletes all auth files. Bot will disconnect.</p>
            </div>
            <Button 
              variant="destructive" 
              onClick={handleResetSession}
              disabled={resetSession.isPending}
              className="font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(255,0,0,0.3)]"
            >
              Execute Purge
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
