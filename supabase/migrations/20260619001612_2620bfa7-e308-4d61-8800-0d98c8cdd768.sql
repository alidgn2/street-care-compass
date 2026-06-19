
-- Restrict realtime topic subscriptions
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Policy: only allow authenticated users to subscribe to topics for conversations they're a member of,
-- or to broadcast topics scoped to themselves for feedings/injury_reports.
CREATE POLICY "Authorized realtime subscriptions"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  CASE
    -- conversation topics: "conversation:<uuid>"
    WHEN realtime.topic() LIKE 'conversation:%' THEN EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id::text = split_part(realtime.topic(), ':', 2)
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
    -- user-scoped topics: "user:<uuid>"
    WHEN realtime.topic() LIKE 'user:%' THEN
      split_part(realtime.topic(), ':', 2) = auth.uid()::text
    ELSE false
  END
);

-- Storage: add UPDATE policy on photos bucket restricting to file owner (folder = uid)
CREATE POLICY "Users can update own photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'photos' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'photos' AND (auth.uid())::text = (storage.foldername(name))[1]);
