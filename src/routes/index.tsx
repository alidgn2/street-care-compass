import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { PawPrint, Heart, MapPin, MessageCircle, ArrowRight } from "lucide-react";
import heroPets from "@/assets/hero-pets.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PatiHarita — Sokak Hayvanları Topluluğu" },
      { name: "description", content: "Mahallendeki sokak hayvanlarına kim mama verdi, kim su koydu? Yaralı hayvanları ihbar et, gönüllülerle sohbet et." },
      { property: "og:title", content: "PatiHarita" },
      { property: "og:description", content: "Sokak sokak hayvan dostluğu." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/harita" />;

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-soft)" }}>
      <header className="px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-warm)]">
              <PawPrint className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold">PatiHarita</span>
          </div>
          <Link to="/auth" className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:bg-muted">Giriş yap</Link>
        </div>
      </header>

      <section className="px-6 py-8 md:py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/50 px-3 py-1 text-xs font-semibold text-secondary">
              <Heart className="h-3.5 w-3.5 fill-primary text-primary" /> Türkiye geneli sokak hayvanları için
            </div>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Mahallendeki <span className="text-primary">patiler</span> yalnız değil.
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Sokak sokak takip et: kim mama verdi, kim su koydu, kim yaralı bir dostu kurtardı. Topluluk olalım.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/auth" className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-[var(--shadow-warm)] transition hover:scale-[1.02]">
                Hemen başla <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#nasil" className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-6 py-3 font-semibold transition hover:bg-muted">Nasıl çalışır?</a>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-card)]">
              <img src={heroPets} alt="Sokak hayvanları" width={1024} height={1024} className="aspect-square w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section id="nasil" className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold md:text-4xl">Nasıl çalışır?</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { icon: MapPin, title: "Sokağı işaretle", desc: "Mama veya su verdiğin yeri haritada işaretle. Bütün mahalle görsün." },
              { icon: Heart, title: "Yaralıyı ihbar et", desc: "Sokakta yaralı bir hayvan gördün mü? Fotoğrafla bildir, yakındaki gönüllüler harekete geçsin." },
              { icon: MessageCircle, title: "Sohbet et", desc: "Diğer hayvanseverlerle direkt mesajlaş, ortak hareket et." },
            ].map((f) => (
              <div key={f.title} className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
                  <f.icon className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="mt-4 text-xl font-bold">{f.title}</h3>
                <p className="mt-2 text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-muted-foreground">
          Her pati değerlidir. 🐾 PatiHarita
        </div>
      </footer>
    </div>
  );
}
