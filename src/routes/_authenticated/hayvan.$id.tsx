import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Cat, Dog, PawPrint, Syringe, Scissors, MapPin, Heart, QrCode, ArrowLeft, CalendarClock, Phone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/hayvan/$id")({
  component: AnimalDetail,
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
  adoption_contact: string | null;
  next_vaccine_date: string | null;
}

function AnimalDetail() {
  const { id } = Route.useParams();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [sightings, setSightings] = useState<number>(0);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("animals").select("*").eq("id", id).maybeSingle();
      if (data) setAnimal(data as Animal);
      const { count } = await supabase.from("animal_sightings").select("*", { count: "exact", head: true }).eq("animal_id", id);
      setSightings(count ?? 0);
    })();
  }, [id]);

  if (!animal) return <AppShell><div className="p-10 text-center text-muted-foreground">Yükleniyor...</div></AppShell>;

  const SpeciesIcon = animal.species === "cat" ? Cat : animal.species === "dog" ? Dog : PawPrint;
  const profileUrl = typeof window !== "undefined" ? `${window.location.origin}/hayvan/${animal.id}` : "";
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(profileUrl)}`;

  const vacDate = animal.next_vaccine_date ? new Date(animal.next_vaccine_date) : null;
  const daysToVac = vacDate ? Math.ceil((vacDate.getTime() - Date.now()) / 86400000) : null;

  return (
    <AppShell>
      <PageHeader
        title={animal.name ?? "İsimsiz dost"}
        subtitle={[animal.street_name, animal.neighborhood].filter(Boolean).join(", ") || undefined}
        action={
          <Link to="/hayvanlar" className="rounded-full p-2 hover:bg-muted"><ArrowLeft className="h-5 w-5" /></Link>
        }
      />
      <div className="mx-auto max-w-2xl space-y-4 p-4">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
          {animal.photo_url ? (
            <img src={animal.photo_url} alt={animal.name ?? "Hayvan"} className="aspect-square w-full object-cover" />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center bg-accent/30">
              <SpeciesIcon className="h-24 w-24 text-secondary" />
            </div>
          )}
          <div className="p-5">
            <div className="flex items-center gap-2">
              <SpeciesIcon className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">{animal.name ?? "İsimsiz dost"}</h2>
            </div>
            {animal.description && <p className="mt-3 text-sm text-muted-foreground">{animal.description}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {animal.vaccinated && <Chip icon={Syringe} text="Aşılı" cls="bg-success/15 text-success" />}
              {animal.neutered && <Chip icon={Scissors} text="Kısır" cls="bg-secondary/15 text-secondary" />}
              {animal.adoptable && <Chip icon={Heart} text="Sahiplenilebilir" cls="bg-primary/15 text-primary" />}
            </div>
            {(animal.street_name || animal.neighborhood) && (
              <div className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {[animal.street_name, animal.neighborhood, animal.city].filter(Boolean).join(", ")}
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">👀 {sightings} kez görüldü</p>
          </div>
        </div>

        {vacDate && (
          <div className={`rounded-2xl border-2 p-4 ${daysToVac !== null && daysToVac <= 14 ? "border-warning bg-warning/10" : "border-border bg-card"}`}>
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              <h3 className="font-bold">Sonraki aşı</h3>
            </div>
            <p className="mt-1 text-sm">
              {vacDate.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
              {daysToVac !== null && daysToVac >= 0 && <span className="ml-2 text-muted-foreground">({daysToVac} gün kaldı)</span>}
              {daysToVac !== null && daysToVac < 0 && <span className="ml-2 text-destructive">(gecikti)</span>}
            </p>
          </div>
        )}

        {animal.adoptable && animal.adoption_contact && (
          <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <h3 className="font-bold">Sahiplenmek ister misin?</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Bu dostumuz yeni bir yuva arıyor.</p>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-card px-3 py-2 text-sm">
              <Phone className="h-4 w-4 text-primary" />
              <span className="font-medium">{animal.adoption_contact}</span>
            </div>
          </div>
        )}

        <button onClick={() => setShowQr(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold shadow-[var(--shadow-card)] hover:bg-muted">
          <QrCode className="h-5 w-5" /> QR künye oluştur
        </button>
        <p className="text-center text-xs text-muted-foreground">QR'ı yazdırıp tasmaya/kulübeye yapıştırabilirsin. Tarayan kişi bu profili görür.</p>
      </div>

      {showQr && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={() => setShowQr(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl bg-card p-6 text-center">
            <h3 className="text-lg font-bold">{animal.name ?? "İsimsiz dost"}</h3>
            <p className="text-xs text-muted-foreground">PatiHarita künyesi</p>
            <img src={qrSrc} alt="QR" className="mx-auto my-4 aspect-square w-full max-w-[280px] rounded-2xl border border-border" />
            <p className="break-all text-[10px] text-muted-foreground">{profileUrl}</p>
            <button onClick={() => setShowQr(false)} className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Kapat</button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Chip({ icon: Icon, text, cls }: { icon: typeof Syringe; text: string; cls: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      <Icon className="h-3 w-3" /> {text}
    </span>
  );
}
