import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { uploadPhoto } from "@/lib/storage";
import { reverseGeocode } from "@/lib/pati-utils";
import { X, Camera, Utensils, Droplet } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  location: { lat: number; lng: number };
  userId: string;
}

export function FeedingDialog({ open, onClose, onCreated, location, userId }: Props) {
  const [type, setType] = useState<"food" | "water" | "both">("both");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const geo = await reverseGeocode(location.lat, location.lng);
      let photo_url: string | null = null;
      if (file) photo_url = await uploadPhoto(file, userId, "feedings");
      const { error } = await supabase.from("feedings").insert({
        user_id: userId,
        lat: location.lat,
        lng: location.lng,
        feeding_type: type,
        notes: notes || null,
        photo_url,
        street_name: geo.street,
        neighborhood: geo.neighborhood,
        city: geo.city,
      });
      if (error) throw error;
      toast.success("Teşekkürler! Bildirimin kaydedildi 🐾");
      onCreated();
      onClose();
      setNotes(""); setFile(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl bg-card p-6 shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Besleme bildir</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-medium">Ne verdin?</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {([
                { v: "food" as const, l: "Mama", I: Utensils },
                { v: "water" as const, l: "Su", I: Droplet },
                { v: "both" as const, l: "İkisi de", I: Utensils },
              ]).map((o) => (
                <button key={o.v} type="button" onClick={() => setType(o.v)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 py-3 text-sm font-medium transition ${type === o.v ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"}`}>
                  <o.I className="h-5 w-5" />{o.l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Not (opsiyonel)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Örn: 3 kediye mama verdim"
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground hover:bg-muted">
              <Camera className="h-5 w-5" />
              <span>{file ? file.name : "Fotoğraf ekle (opsiyonel)"}</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          <button disabled={loading} type="submit"
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-warm)] transition hover:bg-primary/90 disabled:opacity-60">
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </form>
      </div>
    </div>
  );
}
