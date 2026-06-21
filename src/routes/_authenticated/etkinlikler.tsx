import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageHeader } from "@/components/AppShell";
import { getCurrentPosition, reverseGeocode } from "@/lib/pati-utils";
import { Plus, X, CalendarDays, MapPin, Users, Utensils, HeartHandshake, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/etkinlikler")({
  head: () => ({
    meta: [
      { title: "Etkinlikler — PatiHarita" },
      { name: "description", content: "Mahallendeki toplu besleme ve kurtarma etkinlikleri." },
    ],
  }),
  component: EventsPage,
});

interface EventRow {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  starts_at: string;
  lat: number;
  lng: number;
  location_name: string | null;
  neighborhood: string | null;
  city: string | null;
  event_type: string;
}

function EventsPage() {
  const { user } = Route.useRouteContext();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, { count: number; mine: boolean }>>({});
  const [show, setShow] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("events")
      .select("*")
      .gte("starts_at", new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString())
      .order("starts_at", { ascending: true })
      .limit(50);
    const rows = (data ?? []) as EventRow[];
    setEvents(rows);
    if (rows.length) {
      const ids = rows.map((r) => r.id);
      const { data: r } = await supabase.from("event_rsvps").select("event_id,user_id").in("event_id", ids);
      const map: Record<string, { count: number; mine: boolean }> = {};
      ids.forEach((id) => (map[id] = { count: 0, mine: false }));
      (r ?? []).forEach((row: { event_id: string; user_id: string }) => {
        const e = map[row.event_id];
        if (!e) return;
        e.count++;
        if (row.user_id === user.id) e.mine = true;
      });
      setRsvps(map);
    }
  }
  useEffect(() => { load(); }, []);

  async function toggleRsvp(eventId: string, mine: boolean) {
    if (mine) {
      await supabase.from("event_rsvps").delete().eq("event_id", eventId).eq("user_id", user.id);
    } else {
      await supabase.from("event_rsvps").insert({ event_id: eventId, user_id: user.id });
    }
    load();
  }

  async function deleteEvent(id: string) {
    if (!confirm("Etkinlik silinsin mi?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Silindi"); load(); }
  }

  return (
    <AppShell>
      <PageHeader title="Etkinlikler" subtitle={`${events.length} yaklaşan etkinlik`}
        action={
          <button onClick={() => setShow(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Oluştur
          </button>
        } />
      <div className="mx-auto max-w-2xl space-y-3 p-4">
        {events.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">Henüz etkinlik yok. İlk toplu beslemeyi sen organize et!</p>
          </div>
        )}
        {events.map((e) => {
          const r = rsvps[e.id] ?? { count: 0, mine: false };
          const Icon = e.event_type === "rescue" ? HeartHandshake : Utensils;
          const date = new Date(e.starts_at);
          const isMine = e.created_by === user.id;
          return (
            <div key={e.id} className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold">{e.title}</h3>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    {date.toLocaleDateString("tr-TR", { day: "numeric", month: "short", weekday: "short" })} • {date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  {(e.location_name || e.neighborhood) && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{[e.location_name, e.neighborhood, e.city].filter(Boolean).join(", ")}</span>
                    </div>
                  )}
                  {e.description && <p className="mt-2 text-sm text-muted-foreground">{e.description}</p>}
                </div>
                {isMine && (
                  <button onClick={() => deleteEvent(e.id)} className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> {r.count} katılımcı
                </div>
                <button onClick={() => toggleRsvp(e.id, r.mine)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${r.mine ? "bg-success/15 text-success" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
                  {r.mine ? "✓ Katılıyorum" : "Katıl"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {show && <EventForm onClose={() => setShow(false)} onCreated={load} userId={user.id} />}
    </AppShell>
  );
}

function EventForm({ onClose, onCreated, userId }: { onClose: () => void; onCreated: () => void; userId: string }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"feeding" | "rescue" | "other">("feeding");
  const [locationName, setLocationName] = useState("");
  // default: tomorrow 10:00
  const tomorrow = new Date(Date.now() + 86400000);
  tomorrow.setHours(10, 0, 0, 0);
  const [whenLocal, setWhenLocal] = useState(tomorrow.toISOString().slice(0, 16));
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const pos = await getCurrentPosition();
      const geo = await reverseGeocode(pos.lat, pos.lng);
      const { error } = await supabase.from("events").insert({
        created_by: userId,
        title,
        description: description || null,
        starts_at: new Date(whenLocal).toISOString(),
        lat: pos.lat,
        lng: pos.lng,
        location_name: locationName || null,
        neighborhood: geo.neighborhood,
        city: geo.city,
        event_type: type,
      });
      if (error) throw error;
      toast.success("Etkinlik paylaşıldı 🎉");
      onCreated(); onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Hata");
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl bg-card p-6 sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Etkinlik Oluştur</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-medium">Tür</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {([{ v: "feeding" as const, l: "Besleme", I: Utensils }, { v: "rescue" as const, l: "Kurtarma", I: HeartHandshake }, { v: "other" as const, l: "Diğer", I: CalendarDays }]).map((o) => (
                <button key={o.v} type="button" onClick={() => setType(o.v)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 py-3 text-xs font-medium transition ${type === o.v ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"}`}>
                  <o.I className="h-5 w-5" />{o.l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Başlık</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Cumartesi Moda toplu besleme"
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium">Tarih & saat</label>
            <input type="datetime-local" value={whenLocal} onChange={(e) => setWhenLocal(e.target.value)} required
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium">Buluşma yeri (opsiyonel)</label>
            <input value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="Moda sahil, çay bahçesi önü"
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium">Açıklama</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="Ne getirelim, kaç kişiyiz, nasıl bulunuruz..."
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-ring" />
          </div>
          <p className="text-xs text-muted-foreground">📍 Konumun otomatik kaydedilecek.</p>
          <button disabled={loading} type="submit"
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-warm)] hover:bg-primary/90 disabled:opacity-60">
            {loading ? "Oluşturuluyor..." : "Etkinliği yayınla"}
          </button>
        </form>
      </div>
    </div>
  );
}
