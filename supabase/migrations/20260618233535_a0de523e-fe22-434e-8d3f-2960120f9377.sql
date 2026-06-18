
CREATE POLICY "Auth view photos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'photos');
CREATE POLICY "Auth upload photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth delete own photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);
