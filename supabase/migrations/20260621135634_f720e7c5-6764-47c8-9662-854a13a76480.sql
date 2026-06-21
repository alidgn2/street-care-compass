
-- 1) Besleme doğrulamaları
CREATE TABLE public.feeding_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feeding_id uuid NOT NULL REFERENCES public.feedings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (feeding_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.feeding_verifications TO authenticated;
GRANT ALL ON public.feeding_verifications TO service_role;
ALTER TABLE public.feeding_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Herkes doğrulamaları görebilir" ON public.feeding_verifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Kullanıcı kendi doğrulamasını ekler" ON public.feeding_verifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Kullanıcı kendi doğrulamasını siler" ON public.feeding_verifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_fv_feeding ON public.feeding_verifications(feeding_id);
CREATE INDEX idx_fv_user ON public.feeding_verifications(user_id);

-- 2) Mahalle etkinlikleri
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  location_name text,
  neighborhood text,
  city text,
  event_type text NOT NULL DEFAULT 'feeding',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Herkes etkinlikleri görebilir" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Kullanıcı etkinlik oluşturabilir" ON public.events FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Oluşturan etkinliği düzenler" ON public.events FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Oluşturan etkinliği siler" ON public.events FOR DELETE TO authenticated USING (auth.uid() = created_by);
CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();
CREATE INDEX idx_events_starts_at ON public.events(starts_at);
CREATE INDEX idx_events_city ON public.events(city);

-- 3) Etkinliğe katılım (RSVP)
CREATE TABLE public.event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.event_rsvps TO authenticated;
GRANT ALL ON public.event_rsvps TO service_role;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Herkes katılımı görebilir" ON public.event_rsvps FOR SELECT TO authenticated USING (true);
CREATE POLICY "Kullanıcı kendi RSVP ekler" ON public.event_rsvps FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Kullanıcı kendi RSVP siler" ON public.event_rsvps FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_rsvp_event ON public.event_rsvps(event_id);

-- 4) Hayvanlara sahiplenme & aşı tarihi alanları
ALTER TABLE public.animals
  ADD COLUMN IF NOT EXISTS adoptable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS adoption_contact text,
  ADD COLUMN IF NOT EXISTS next_vaccine_date date;
