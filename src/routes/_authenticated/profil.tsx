import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageHeader } from "@/components/AppShell";
import { LogOut, Utensils, Heart, Pencil, Check, Trophy, TrendingUp, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({
    meta: [{ title: "Profil — PatiHarita" }, { name: "description", content: "Profil bilgilerin, gönüllü istatistiklerin ve liderlik tablosu." }],
  }),
  component: ProfilePage,
});

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  neighborhood: string | null;
  bio: string | null;
  feeding_count: number;
  rescue_count: number;
}

interface LeaderRow { id: string; full_name: string | null; username: string | null; feeding_count: number; neighborhood: string | null; }

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: "", username: "", neighborhood: "", bio: "" });
  const [leaders, setLeaders] = useState<LeaderRow[]>([]);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [weeklyMine, setWeeklyMine] = useState(0);

  async function load() {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (data) {
      setProfile(data as Profile);
      setForm({
        full_name: data.full_name ?? "",
        username: data.username ?? "",
        neighborhood: data.neighborhood ?? "",
        bio: data.bio ?? "",
      });
    }
    const { data: lb } = await supabase
      .from("profiles")
      .select("id,full_name,username,feeding_count,neighborhood")
      .order("feeding_count", { ascending: false })
      .limit(10);
    setLeaders((lb ?? []) as LeaderRow[]);

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const [{ count: total }, { count: mine }] = await Promise.all([
      supabase.from("feedings").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
      supabase.from("feedings").select("*", { count: "exact", head: true }).gte("created_at", weekAgo).eq("user_id", user.id),
    ]);
    setWeeklyTotal(total ?? 0);
    setWeeklyMine(mine ?? 0);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    const { error } = await supabase.from("profiles").update(form).eq("id", user.id);
    if (error) toast.error(error.message);
    else { toast.success("Profil güncellendi"); setEditing(false); load(); }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  if (!profile) return <AppShell><div className="p-10 text-center text-muted-foreground">Yükleniyor...</div></AppShell>;

  return (
    <AppShell>
      <PageHeader title="Profilim" />
      <div className="mx-auto max-w-2xl space-y-4 p-4">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 sm:gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-primary-foreground sm:h-20 sm:w-20 sm:text-3xl" style={{ background: "var(--gradient-warm)" }}>
              {(profile.full_name?.[0] ?? profile.username?.[0] ?? "?").toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold sm:text-xl">{profile.full_name ?? "İsimsiz"}</h2>
              {profile.username && <p className="truncate text-sm text-muted-foreground">@{profile.username}</p>}
              {profile.neighborhood && <p className="mt-1 truncate text-xs text-muted-foreground">📍 {profile.neighborhood}</p>}
            </div>
            <button onClick={() => setEditing(!editing)} className="shrink-0 rounded-full p-2 hover:bg-muted">
              {editing ? <Check className="h-5 w-5 text-success" onClick={save} /> : <Pencil className="h-4 w-4" />}
            </button>
          </div>
          {profile.bio && !editing && <p className="mt-4 text-sm text-muted-foreground">{profile.bio}</p>}

          {editing && (
            <div className="mt-4 space-y-3">
              {([
                { k: "full_name" as const, l: "Adın" },
                { k: "username" as const, l: "Kullanıcı adı" },
                { k: "neighborhood" as const, l: "Mahalle" },
              ]).map((f) => (
                <input key={f.k} value={form[f.k]} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} placeholder={f.l}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-ring" />
              ))}
              <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="Kısa bio..."
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-ring" />
              <button onClick={save} className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Kaydet</button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-[var(--shadow-card)]">
            <Utensils className="mx-auto h-6 w-6 text-primary" />
            <p className="mt-2 text-3xl font-bold">{profile.feeding_count}</p>
            <p className="text-xs text-muted-foreground">Toplam besleme</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-[var(--shadow-card)]">
            <Heart className="mx-auto h-6 w-6 fill-destructive text-destructive" />
            <p className="mt-2 text-3xl font-bold">{profile.rescue_count}</p>
            <p className="text-xs text-muted-foreground">Yardım</p>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/30 p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-bold">Bu hafta</h3>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-2xl font-black text-primary">{weeklyTotal}</p>
              <p className="text-xs text-muted-foreground">Toplulukta besleme</p>
            </div>
            <div>
              <p className="text-2xl font-black text-primary">{weeklyMine}</p>
              <p className="text-xs text-muted-foreground">Senin katkın</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-warning" />
            <h3 className="font-bold">Liderlik tablosu</h3>
          </div>
          <ol className="mt-3 space-y-2">
            {leaders.map((l, i) => {
              const isMe = l.id === user.id;
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
              return (
                <li key={l.id} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${isMe ? "bg-primary/10 ring-1 ring-primary/30" : ""}`}>
                  <span className="w-7 shrink-0 text-center text-sm font-bold">{medal}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{l.full_name ?? l.username ?? "Anonim"} {isMe && <span className="text-xs text-primary">(sen)</span>}</p>
                    {l.neighborhood && <p className="truncate text-[10px] text-muted-foreground">📍 {l.neighborhood}</p>}
                  </div>
                  <span className="shrink-0 rounded-full bg-card px-2 py-0.5 text-xs font-bold text-primary">{l.feeding_count}</span>
                </li>
              );
            })}
            {leaders.length === 0 && <p className="text-sm text-muted-foreground">Henüz veri yok.</p>}
          </ol>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-bold">Rozetler</h3>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.feeding_count >= 1 && <Badge text="🌱 İlk besleme" />}
            {profile.feeding_count >= 10 && <Badge text="🐾 10+ besleme" />}
            {profile.feeding_count >= 50 && <Badge text="⭐ Düzenli gönüllü" />}
            {profile.feeding_count >= 100 && <Badge text="👑 Pati efsanesi" />}
            {profile.rescue_count >= 1 && <Badge text="❤️ Kurtarıcı" />}
            {profile.feeding_count === 0 && profile.rescue_count === 0 && (
              <p className="text-sm text-muted-foreground">Henüz rozet yok. Bir besleme veya ihbar paylaş!</p>
            )}
          </div>
        </div>

        <button onClick={signOut}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive transition hover:bg-destructive/10">
          <LogOut className="h-4 w-4" /> Çıkış yap
        </button>
      </div>
    </AppShell>
  );
}

function Badge({ text }: { text: string }) {
  return <span className="rounded-full bg-accent/60 px-3 py-1 text-sm font-semibold text-secondary">{text}</span>;
}
