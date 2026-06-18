import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageHeader } from "@/components/AppShell";
import { uploadPhoto } from "@/lib/storage";
import { getCurrentPosition, reverseGeocode, timeAgo } from "@/lib/pati-utils";
import { Plus, X, Camera, AlertTriangle, MapPin, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "İhbarlar — PatiHarita" },
      { name: "description", content: "Yaralı sokak hayvanı ihbarlarını gör ve yenisini bildir." },
    ],
  }),
  component: ReportsPage,
});

interface Report {
  id: string;
  user_id: string;
  lat: number;
  lng: number;
  street_name: string | null;
  neighborhood: string | null;
  city: string | null;
  severity: "low" | "medium" | "high";
  description: string;
  photo_url: string | null;
  status: "open" | "in_progress" | "resolved";
  created_at: string;
}

const sevColors = {
  high: { bg: "bg-destructive/10", border: "border-destructive", text: "text-destructive", label: "Acil" },
  medium: { bg: "bg-warning/15", border: "border-warning", text: "text-warning-foreground", label: "Orta" },
  low: { bg: "bg-muted", border: "border-border", text: "text-muted-foreground", label: "Hafif" },
} as const;
const statusLabels = { open: "Açık", in_progress: "İlgileniliyor", resolved: "Çözüldü" } as const;

function ReportsPage() {
  const { user } = Route.useRouteContext();
  const [reports, setReports] = useState<Report[]>([]);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const { data } = await supabase.from("injury_reports").select("*").order("created_at", { ascending: false }).limit(100);
    setReports((data ?? []) as Report[]);
  }
  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: Report["status"]) {
    const { error } = await supabase.from("injury_reports").update({ status, resolved_by: status === "resolved" ? user.id : null }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Durum güncellendi"); load(); }
  }

  return (
    <AppShell>
      <PageHeader title="Yaralı İhbarları" subtitle={`${reports.filter((r) => r.status !== "resolved").length} aktif ihbar`}
        action={
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground shadow transition hover:bg-destructive/90">
            <Plus className="h-4 w-4" /> İhbar
          </button>
        } />
      <div className="mx-auto max-w-2xl space-y-3 p-4">
        {reports.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">Henüz ihbar yok. Sokakta yaralı bir hayvan görürsen bildir.</p>
          </div>
        )}
        {reports.map((r) => {
          const s = sevColors[r.severity];
          return (
            <div key={r.id} className={`rounded-2xl border-2 ${s.border} ${s.bg} p-4 shadow-[var(--shadow-card)]`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full bg-card px-2 py-0.5 text-xs font-bold ${s.text}`}>{s.label}</span>
                    <span className="rounded-full bg-card/80 px-2 py-0.5 text-xs font-medium text-muted-foreground">{statusLabels[r.status]}</span>
                    <span className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</span>
                  </div>
                  <p className="mt-2 text-sm">{r.description}</p>
                  {(r.street_name || r.neighborhood) && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {[r.street_name, r.neighborhood, r.city].filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
                {r.photo_url && (
                  <img src={r.photo_url} alt="" className="h-20 w-20 rounded-xl object-cover" />
                )}
              </div>

              {r.status !== "resolved" && (
                <div className="mt-3 flex gap-2">
                  {r.status === "open" && (
                    <button onClick={() => updateStatus(r.id, "in_progress")}
                      className="flex-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground hover:opacity-90">
                      İlgileniyorum
                    </button>
                  )}
                  <button onClick={() => updateStatus(r.id, "resolved")}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground hover:opacity-90">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Çözüldü
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showForm && <ReportForm onClose={() => setShowForm(false)} onCreated={load} userId={user.id} />}
    </AppShell>
  );
}

function ReportForm({ onClose, onCreated, userId }: { onClose: () => void; onCreated: () => void; userId: string }) {
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const pos = await getCurrentPosition();
      const geo = await reverseGeocode(pos.lat, pos.lng);
      let photo_url: string | null = null;
      if (file) photo_url = await uploadPhoto(file, userId, "reports");
      const { error } = await supabase.from("injury_reports").insert({
        user_id: userId, lat: pos.lat, lng: pos.lng,
        street_name: geo.street, neighborhood: geo.neighborhood, city: geo.city,
        severity, description, photo_url,
      });
      if (error) throw error;
      toast.success("İhbar paylaşıldı 💚");
      onCreated(); onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Hata");
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl bg-card p-6 sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Yaralı Hayvan İhbarı</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-medium">Aciliyet</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["high", "medium", "low"] as const).map((s) => (
                <button key={s} type="button" onClick={() => setSeverity(s)}
                  className={`rounded-xl border-2 py-2.5 text-sm font-semibold transition ${severity === s ? `${sevColors[s].border} ${sevColors[s].bg} ${sevColors[s].text}` : "border-border bg-background text-muted-foreground"}`}>
                  {sevColors[s].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Açıklama</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={3}
              placeholder="Ne gördün? Hayvanın durumu nasıl?"
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-ring" />
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground hover:bg-muted">
            <Camera className="h-5 w-5" />
            <span>{file ? file.name : "Fotoğraf ekle"}</span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <p className="text-xs text-muted-foreground">📍 Konumun otomatik kaydedilecek.</p>
          <button disabled={loading} type="submit"
            className="w-full rounded-xl bg-destructive py-3 text-sm font-semibold text-destructive-foreground shadow transition hover:bg-destructive/90 disabled:opacity-60">
            {loading ? "Gönderiliyor..." : "İhbar et"}
          </button>
        </form>
      </div>
    </div>
  );
}
