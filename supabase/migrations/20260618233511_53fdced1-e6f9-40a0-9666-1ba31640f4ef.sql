
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  neighborhood TEXT,
  avatar_url TEXT,
  bio TEXT,
  feeding_count INTEGER NOT NULL DEFAULT 0,
  rescue_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable signed in" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.feedings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  street_name TEXT,
  neighborhood TEXT,
  city TEXT,
  feeding_type TEXT NOT NULL CHECK (feeding_type IN ('food','water','both')),
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX feedings_location_idx ON public.feedings (lat, lng);
CREATE INDEX feedings_created_idx ON public.feedings (created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedings TO authenticated;
GRANT ALL ON public.feedings TO service_role;
ALTER TABLE public.feedings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Feedings viewable signed in" ON public.feedings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own feedings" ON public.feedings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own feedings" ON public.feedings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own feedings" ON public.feedings FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.injury_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  street_name TEXT,
  neighborhood TEXT,
  city TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high')),
  description TEXT NOT NULL,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX injury_status_idx ON public.injury_reports (status, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.injury_reports TO authenticated;
GRANT ALL ON public.injury_reports TO service_role;
ALTER TABLE public.injury_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reports viewable signed in" ON public.injury_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert reports" ON public.injury_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone signed in updates reports" ON public.injury_reports FOR UPDATE TO authenticated USING (true);

CREATE TABLE public.animals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  species TEXT NOT NULL CHECK (species IN ('cat','dog','other')),
  description TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  street_name TEXT,
  neighborhood TEXT,
  city TEXT,
  photo_url TEXT,
  vaccinated BOOLEAN NOT NULL DEFAULT false,
  neutered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.animals TO authenticated;
GRANT ALL ON public.animals TO service_role;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Animals viewable signed in" ON public.animals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert animals" ON public.animals FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Anyone signed in updates animals" ON public.animals FOR UPDATE TO authenticated USING (true);

CREATE TABLE public.animal_sightings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.animal_sightings TO authenticated;
GRANT ALL ON public.animal_sightings TO service_role;
ALTER TABLE public.animal_sightings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sightings viewable signed in" ON public.animal_sightings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own sightings" ON public.animal_sightings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_ordered CHECK (user1_id < user2_id),
  UNIQUE (user1_id, user2_id)
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own conversations" ON public.conversations FOR SELECT TO authenticated USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users create conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users update own conversations" ON public.conversations FOR UPDATE TO authenticated USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX messages_conv_idx ON public.messages (conversation_id, created_at);
GRANT SELECT, INSERT, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own messages" ON public.messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid()))
);
CREATE POLICY "Users send own messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid()))
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.increment_feeding_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET feeding_count = feeding_count + 1 WHERE id = NEW.user_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_feeding_inserted AFTER INSERT ON public.feedings FOR EACH ROW EXECUTE FUNCTION public.increment_feeding_count();

CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_message_inserted AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();

CREATE OR REPLACE FUNCTION public.tg_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();
CREATE TRIGGER injury_updated_at BEFORE UPDATE ON public.injury_reports FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();
CREATE TRIGGER animals_updated_at BEFORE UPDATE ON public.animals FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.injury_reports;
