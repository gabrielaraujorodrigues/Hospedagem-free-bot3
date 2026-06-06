import { Link, useLocation } from "wouter";
import { Terminal, Activity, Plug, Settings as SettingsIcon, FolderOpen } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Activity },
    { href: "/connect", label: "Conectar", icon: Plug },
    { href: "/logs", label: "Logs", icon: Terminal },
    { href: "/files", label: "Arquivos", icon: FolderOpen },
    { href: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen w-full bg-background text-foreground font-mono overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold tracking-tighter uppercase">Jordan Bot<span className="text-xs ml-2 text-primary/70">v3</span></h1>
          <div className="text-xs text-muted-foreground mt-1">// HOSTING_PANEL</div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                  isActive 
                    ? "bg-primary text-primary-foreground font-bold shadow-[0_0_10px_rgba(0,255,157,0.3)]" 
                    : "text-foreground hover:bg-secondary hover:text-primary"
                }`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
                {isActive && <div className="ml-auto w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border text-xs text-muted-foreground text-center">
          SYSTEM_ONLINE
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-y-auto">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-30"></div>
        <div className="p-8 max-w-6xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
