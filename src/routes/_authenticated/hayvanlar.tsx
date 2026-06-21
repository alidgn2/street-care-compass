import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageHeader } from "@/components/AppShell";
import { uploadPhoto } from "@/lib/storage";
import { getCurrentPosition, reverseGeocode } from "@/lib/pati-utils";
import { Plus, X, Camera, PawPrint, Cat, Dog, Syringe, Scissors, MapPin, Heart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/hayvanlar")({
  head: () => ({
    meta: [
      { title: "Hayvanlar — PatiHarita" },
      { name: "description", content: "Mahalledeki tanıdık sokak hayvanlarının profilleri." },
    ],
  }),
  component: AnimalsPage,
});

interface Animal {
  id: string;
  name: string | null;
  species: "cat" | "dog" | "other";
  description: string | null;
  neighborhood: string | null;
  street_name: string | null;
  city: string | null;
  photo_url: string | null;
  vaccinated: boolean;
  neutered: boolean;
  adoptable: boolean;
}

type Filter = "all" | "adoptable" | "cat" | "dog";

function AnimalsPage() {
  const { user } = Route.useRouteContext();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [show, setShow] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  async function load() {
    const { data } = await supabase.from("animals").select("*").order("created_at", { ascending: false }).limit(60);
    setAnimals((data ?? []) as Animal[]);
  }
  useEffect(() => { load(); }, []);

  const filtered = animals.filter((a) => {
    if (filter === "all") return true;
    if (filter === "adoptable") return a.adoptable;
    return a.species === filter;
  });

  return (
    <AppShell>
      <PageHeader title="Hayvanlar" subtitle="Mahallenin tanıdık dostları"
        action={
          <button onClick={() => setShow(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Ekle
          </button>
        } />
      <div className="mx-auto max-w-2xl space-y-4 p-4">
        <div className="flex gap-2 overflow-x-auto">
          {([
            { v: "all" as const, l: "Hepsi" },
            { v: "adoptable" as const, l: "❤️ Sahiplenilebilir" },
            { v: "cat" as const, l: "🐱 Kedi" },
            { v: "dog" as const, l: "🐶 Köpek" },
          ]).map((c) => (
            <button key={c.v} onClick={() => setFilter(c.v)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${filter === c.v ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border"}`}>
              {c.l}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.length === 0 && (
            <div className="col-span-full rounded-3xl border border-dashed border-border bg-card p-10 text-center">
              <PawPrint className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">Bu filtrede hayvan yok.</p>
            </div>
          )}
          {filtered.map((a) => {
            const SpeciesIcon = a.species === "cat" ? Cat : a.species === "dog" ? Dog : PawPrint;
            return (
              <Link key={a.id} to="/hayvan/$id" params={{ id: a.id }}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition hover:-translate-y-1">
                {a.photo_url ? (
                  <img src={a.photo_url} alt={a.name ?? "Hayvan"} className="aspect-square w-full object-cover" />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center bg-accent/30">
                    <SpeciesIcon className="h-16 w-16 text-secondary" />
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-center gap-1.5">
                    <SpeciesIcon className="h-4 w-4 text-primary" />
                    <h3 className="truncate font-bold">{a.name ?? "İsimsiz dost"}</h3>
                  </div>
                  {(a.street_name || a.neighborhood) && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{[a.street_name, a.neighborhood].filter(Boolean).join(", ")}</span>
                    </div>
                  )}
                  {a.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{a.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {a.adoptable && <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary"><Heart className="h-2.5 w-2.5" />Sahiplen</span>}
                    {a.vaccinated && <span className="inline-flex items-center gap-0.5 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success"><Syringe className="h-2.5 w-2.5" />Aşılı</span>}
                    {a.neutered && <span className="inline-flex items-center gap-0.5 rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-semibold text-secondary"><Scissors className="h-2.5 w-2.5" />Kısır</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {show && <AnimalForm onClose={() => setShow(false)} onCreated={load} userId={user.id} />}
    </AppShell>
  );
}

function AnimalForm({ onClose, onCreated, userId }: { onClose: () => void; onCreated: () => void; userId: string }) {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState<"cat" | "dog" | "other">("cat");
  const [description, setDescription] = useState("");
  const [vaccinated, setVaccinated] = useState(false);
  const [neutered, setNeutered] = useState(false);
  const [adoptable, setAdoptable] = useState(false);
  const [adoptionContact, setAdoptionContact] = useState("");
  const [nextVaccineDate, setNextVaccineDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      let pos: { lat: number; lng: number } | null = null;
      let geo = { street: null as string | null, neighborhood: null as string | null, city: null as string | null };
      try {
        pos = await getCurrentPosition();
        geo = await reverseGeocode(pos.lat, pos.lng);
      } catch { /* konum opsiyonel */ }
      let photo_url: string | null = null;
      if (file) photo_url = await uploadPhoto(file, userId, "animals");
      const { error } = await supabase.from("animals").insert({
        created_by: userId,
        name: name || null, species, description: description || null,
        lat: pos?.lat ?? null, lng: pos?.lng ?? null,
        street_name: geo.street, neighborhood: geo.neighborhood, city: geo.city,
        vaccinated, neutered, photo_url,
        adoptable, adoption_contact: adoptable && adoptionContact ? adoptionContact : null,
        next_vaccine_date: nextVaccineDate || null,
      });
      if (error) throw error;
      toast.success("Hayvan profili eklendi 🐾");
      onCreated(); onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Hata");
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl bg-card p-6 sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Hayvan Profili</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-medium">Tür</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {([{ v: "cat", l: "Kedi", I: Cat }, { v: "dog", l: "Köpek", I: Dog }, { v: "other", l: "Diğer", I: PawPrint }] as const).map((o) => (
                <button key={o.v} type="button" onClick={() => setSpecies(o.v)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 py-3 text-sm font-medium transition ${species === o.v ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"}`}>
                  <o.I className="h-5 w-5" />{o.l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">İsim (opsiyonel)</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Boncuk"
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium">Açıklama</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              placeholder="Sarman, dost canlısı, akşamları markete gelir..."
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex gap-3">
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm hover:bg-muted">
              <input type="checkbox" checked={vaccinated} onChange={(e) => setVaccinated(e.target.checked)} className="h-4 w-4 accent-primary" />
              <Syringe className="h-4 w-4" /> Aşılı
            </label>
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm hover:bg-muted">
              <input type="checkbox" checked={neutered} onChange={(e) => setNeutered(e.target.checked)} className="h-4 w-4 accent-primary" />
              <Scissors className="h-4 w-4" /> Kısır
            </label>
          </div>
          <div>
            <label className="text-sm font-medium">Sonraki aşı tarihi (opsiyonel)</label>
            <input type="date" value={nextVaccineDate} onChange={(e) => setNextVaccineDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-ring" />
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-primary/30 bg-primary/5 px-3 py-2.5 text-sm">
            <input type="checkbox" checked={adoptable} onChange={(e) => setAdoptable(e.target.checked)} className="h-4 w-4 accent-primary" />
            <Heart className="h-4 w-4 text-primary" /> Sahiplenilebilir
          </label>
          {adoptable && (
            <input value={adoptionContact} onChange={(e) => setAdoptionContact(e.target.value)} placeholder="İletişim (telefon / @kullanıcı)"
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-ring" />
          )}
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground hover:bg-muted">
            <Camera className="h-5 w-5" /><span>{file ? file.name : "Fotoğraf ekle"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <button disabled={loading} type="submit"
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-warm)] hover:bg-primary/90 disabled:opacity-60">
            {loading ? "Ekleniyor..." : "Profili kaydet"}
          </button>
        </form>
      </div>
    </div>
  );
}
