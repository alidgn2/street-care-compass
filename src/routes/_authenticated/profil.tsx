import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageHeader } from "@/components/AppShell";
import { LogOut, Utensils, Heart, Pencil, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({
    meta: [{ title: "Profil — PatiHarita" }, { name: "description", content: "Profil bilgilerin ve gönüllü istatistiklerin." }],
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

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: "", username: "", neighborhood: "", bio: "" });

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
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold text-primary-foreground" style={{ background: "var(--gradient-warm)" }}>
              {(profile.full_name?.[0] ?? profile.username?.[0] ?? "?").toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-bold">{profile.full_name ?? "İsimsiz"}</h2>
              {profile.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
              {profile.neighborhood && <p className="mt-1 text-xs text-muted-foreground">📍 {profile.neighborhood}</p>}
            </div>
            <button onClick={() => setEditing(!editing)} className="rounded-full p-2 hover:bg-muted">
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
            <p className="text-xs text-muted-foreground">Besleme</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-[var(--shadow-card)]">
            <Heart className="mx-auto h-6 w-6 fill-destructive text-destructive" />
            <p className="mt-2 text-3xl font-bold">{profile.rescue_count}</p>
            <p className="text-xs text-muted-foreground">Yardım</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <h3 className="font-bold">Rozetler</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.feeding_count >= 1 && <Badge text="🌱 İlk besleme" />}
            {profile.feeding_count >= 10 && <Badge text="🐾 10+ besleme" />}
            {profile.feeding_count >= 50 && <Badge text="⭐ Düzenli gönüllü" />}
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
