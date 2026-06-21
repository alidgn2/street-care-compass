import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageHeader } from "@/components/AppShell";
import { MapView, type MapMarker } from "@/components/MapView";
import { FeedingDialog } from "@/components/FeedingDialog";
import { getCurrentPosition, feedingFreshness, timeAgo, escapeHtml } from "@/lib/pati-utils";
import { Plus, Locate, Loader2, CalendarDays } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/harita")({
  head: () => ({
    meta: [
      { title: "Harita — PatiHarita" },
      { name: "description", content: "Mahallendeki son besleme ve ihbarları haritada gör." },
    ],
  }),
  component: MapPage,
});

interface FeedingRow {
  id: string;
  lat: number;
  lng: number;
  feeding_type: string;
  street_name: string | null;
  neighborhood: string | null;
  notes: string | null;
  created_at: string;
}
interface InjuryRow {
  id: string;
  lat: number;
  lng: number;
  severity: string;
  description: string;
  status: string;
  created_at: string;
}

declare global {
  interface Window {
    __patiVerifyFeeding?: (id: string) => void;
  }
}

function MapPage() {
  const { user } = Route.useRouteContext();
  const [center, setCenter] = useState<[number, number]>([39.9334, 32.8597]); // Ankara default
  const [feedings, setFeedings] = useState<FeedingRow[]>([]);
  const [injuries, setInjuries] = useState<InjuryRow[]>([]);
  const [verifyCounts, setVerifyCounts] = useState<Record<string, { count: number; mine: boolean }>>({});
  const [dialog, setDialog] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  async function loadVerifications(feedingIds: string[]) {
    if (!feedingIds.length) return;
    const { data } = await supabase.from("feeding_verifications").select("feeding_id,user_id").in("feeding_id", feedingIds);
    const map: Record<string, { count: number; mine: boolean }> = {};
    feedingIds.forEach((id) => (map[id] = { count: 0, mine: false }));
    (data ?? []).forEach((row: { feeding_id: string; user_id: string }) => {
      const e = map[row.feeding_id];
      if (!e) return;
      e.count++;
      if (row.user_id === user.id) e.mine = true;
    });
    setVerifyCounts(map);
  }

  async function loadData() {
    const since = new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString();
    const [{ data: f }, { data: i }] = await Promise.all([
      supabase.from("feedings").select("id,lat,lng,feeding_type,street_name,neighborhood,notes,created_at").gte("created_at", since).order("created_at", { ascending: false }),
      supabase.from("injury_reports").select("id,lat,lng,severity,description,status,created_at").neq("status", "resolved").order("created_at", { ascending: false }),
    ]);
    const fed = (f ?? []) as FeedingRow[];
    setFeedings(fed);
    setInjuries((i ?? []) as InjuryRow[]);
    await loadVerifications(fed.map((x) => x.id));
  }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    window.__patiVerifyFeeding = async (id: string) => {
      const existing = verifyCounts[id];
      if (existing?.mine) {
        await supabase.from("feeding_verifications").delete().eq("feeding_id", id).eq("user_id", user.id);
        toast.success("Doğrulamanı kaldırdın");
      } else {
        const { error } = await supabase.from("feeding_verifications").insert({ feeding_id: id, user_id: user.id });
        if (error) { toast.error(error.message); return; }
        toast.success("Doğruladın 🙌");
      }
      loadVerifications(feedings.map((x) => x.id));
    };
    return () => { delete window.__patiVerifyFeeding; };
  }, [user.id, verifyCounts, feedings]);

  async function locate() {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      setCenter([pos.lat, pos.lng]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Konum alınamadı");
    } finally {
      setLocating(false);
    }
  }

  useEffect(() => { locate(); }, []);

  const markers = useMemo<MapMarker[]>(() => {
    const fed = feedings.map((f) => {
      const v = verifyCounts[f.id] ?? { count: 0, mine: false };
      const btnLabel = v.mine ? `✓ Doğrulandı (${v.count})` : `👍 Doğrula${v.count ? ` (${v.count})` : ""}`;
      const btnStyle = v.mine
        ? "background:#16a34a;color:white;"
        : "background:#FF6B35;color:white;";
      return {
        id: `f-${f.id}`, lat: f.lat, lng: f.lng,
        kind: (`feeding-${feedingFreshness(f.created_at)}` as MapMarker["kind"]),
        popup: `<div style="min-width:180px"><b>${escapeHtml(f.street_name ?? "Sokak")}</b><br/>${f.feeding_type === "food" ? "🍽 Mama" : f.feeding_type === "water" ? "💧 Su" : "🍽💧 Mama+Su"}<br/><span style="color:#888;font-size:11px">${escapeHtml(timeAgo(f.created_at))}</span>${f.notes ? `<br/><i style="font-size:12px">${escapeHtml(f.notes)}</i>` : ""}<br/><button onclick="window.__patiVerifyFeeding && window.__patiVerifyFeeding('${f.id}')" style="margin-top:8px;padding:6px 12px;border:none;border-radius:999px;font-weight:600;font-size:12px;cursor:pointer;${btnStyle}">${btnLabel}</button></div>`,
      };
    });
    const inj = injuries.map((i) => ({
      id: `i-${i.id}`, lat: i.lat, lng: i.lng,
      kind: "injury" as const,
      popup: `<div><b style="color:#dc2626">🚨 Yaralı hayvan</b><br/>${escapeHtml(i.description.slice(0, 100))}<br/><span style="color:#888">${escapeHtml(timeAgo(i.created_at))}</span></div>`,
    }));
    return [...fed, ...inj];
  }, [feedings, injuries, verifyCounts]);

  async function quickFeed() {
    try {
      const pos = await getCurrentPosition();
      setDialog({ lat: pos.lat, lng: pos.lng });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Önce konumunu paylaş");
    }
  }

  return (
    <AppShell>
      <PageHeader title="Harita" subtitle="Son 72 saatin beslemeleri ve aktif ihbarlar"
        action={
          <Link to="/etkinlikler" className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-2.5 py-2 text-xs font-semibold hover:bg-muted">
            <CalendarDays className="h-4 w-4" /> Etkinlik
          </Link>
        } />
      <div className="relative" style={{ height: "calc(100vh - 170px)" }}>
        <MapView center={center} markers={markers} onMapClick={(lat, lng) => setDialog({ lat, lng })} />

        <div className="pointer-events-none absolute bottom-4 right-4 z-[1000] flex flex-col gap-3">
          <button onClick={locate} disabled={locating}
            className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-lg transition hover:scale-105">
            {locating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Locate className="h-5 w-5 text-secondary" />}
          </button>
          <button onClick={quickFeed}
            className="pointer-events-auto flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-warm)] transition hover:scale-105">
            <Plus className="h-5 w-5" /> Besleme
          </button>
        </div>

        <div className="pointer-events-none absolute left-2 top-2 z-[1000] flex flex-wrap gap-1.5">
          {[
            { label: "<12s", color: "#16a34a" },
            { label: "<24s", color: "#eab308" },
            { label: ">24s", color: "#ef4444" },
            { label: "Yaralı", color: "#dc2626" },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-1 rounded-full bg-card/95 px-2 py-0.5 text-[10px] font-medium shadow backdrop-blur">
              <span className="h-2 w-2 rounded-full" style={{ background: l.color }} /> {l.label}
            </span>
          ))}
        </div>
      </div>

      {dialog && (
        <FeedingDialog
          open={true}
          onClose={() => setDialog(null)}
          onCreated={loadData}
          location={dialog}
          userId={user.id}
        />
      )}
    </AppShell>
  );
}
