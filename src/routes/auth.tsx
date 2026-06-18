import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PawPrint } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Giriş Yap — PatiHarita" },
      { name: "description", content: "Hesabına giriş yap veya yeni hesap oluştur." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate({ to: "/app", replace: true });
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Hesap oluşturuldu! Giriş yapılıyor...");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Hoş geldin!");
      }
      navigate({ to: "/app", replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Bir hata oluştu";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10" style={{ background: "var(--gradient-soft)" }}>
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-warm)]">
            <PawPrint className="h-6 w-6" />
          </div>
          <span className="font-display text-2xl font-bold">PatiHarita</span>
        </Link>

        <div className="rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-card)]">
          <h1 className="text-2xl font-bold">{mode === "signin" ? "Tekrar hoş geldin" : "Aramıza katıl"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "Hesabınla giriş yap." : "Sokak hayvanlarına birlikte yardım edelim."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-sm font-medium">Adın</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} required type="text" placeholder="Ayşe Yıldız"
                  className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none ring-ring transition focus:ring-2" />
              </div>
            )}
            <div>
              <label className="text-sm font-medium">E-posta</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="ornek@mail.com" autoComplete="email"
                className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none ring-ring transition focus:ring-2" />
            </div>
            <div>
              <label className="text-sm font-medium">Şifre</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} type="password" placeholder="En az 6 karakter" autoComplete={mode === "signin" ? "current-password" : "new-password"}
                className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none ring-ring transition focus:ring-2" />
            </div>
            <button disabled={loading} type="submit"
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-warm)] transition hover:bg-primary/90 disabled:opacity-60">
              {loading ? "Lütfen bekle..." : mode === "signin" ? "Giriş yap" : "Hesap oluştur"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "Hesabın yok mu?" : "Hesabın var mı?"}{" "}
            <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="font-semibold text-primary hover:underline">
              {mode === "signin" ? "Kayıt ol" : "Giriş yap"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
