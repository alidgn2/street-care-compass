import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Map, AlertTriangle, PawPrint, MessageCircle, User } from "lucide-react";

const tabs = [
  { to: "/harita", label: "Harita", icon: Map },
  { to: "/ihbarlar", label: "İhbar", icon: AlertTriangle },
  { to: "/hayvanlar", label: "Hayvanlar", icon: PawPrint },
  { to: "/sohbet", label: "Sohbet", icon: MessageCircle },
  { to: "/profil", label: "Profil", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <main className="flex-1">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.1)]">
        <div className="mx-auto flex max-w-2xl items-center justify-around px-2 py-2">
          {tabs.map((t) => {
            const active = t.to === "/harita" ? pathname === "/harita" : pathname.startsWith(t.to);
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "fill-primary/20" : ""}`} />
                <span>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background/95 px-4 py-4 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action}
      </div>
    </div>
  );
}
