
-- 1. animals: restrict UPDATE to creator
DROP POLICY IF EXISTS "Anyone signed in updates animals" ON public.animals;
CREATE POLICY "Creators update own animals" ON public.animals
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators delete own animals" ON public.animals
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- 2. injury_reports: restrict UPDATE to owner
DROP POLICY IF EXISTS "Anyone signed in updates reports" ON public.injury_reports;
CREATE POLICY "Owners update own reports" ON public.injury_reports
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners delete own reports" ON public.injury_reports
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 3. storage.objects photos: restrict raw SELECT to folder owner (shared photos use signed URLs)
DROP POLICY IF EXISTS "Auth view photos" ON storage.objects;
CREATE POLICY "Owners view own photo objects" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'photos'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- 4. realtime.messages: enable RLS and scope to participants
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants subscribe to chat topics" ON realtime.messages;
CREATE POLICY "Participants subscribe to chat topics" ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    realtime.topic() = ('conv-list-' || auth.uid()::text)
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE ('chat-' || c.id::text) = realtime.topic()
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

-- 5. Lock down SECURITY DEFINER trigger functions: revoke direct execute and pin search_path
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_feeding_count() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_conversation_timestamp() FROM PUBLIC, anon, authenticated;

-- 6. Fix mutable search_path on tg_updated_at
CREATE OR REPLACE FUNCTION public.tg_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$;

REVOKE ALL ON FUNCTION public.tg_updated_at() FROM PUBLIC, anon, authenticated;
