import { supabase } from "@/integrations/supabase/client";

export async function uploadPhoto(file: File, userId: string, folder: string): Promise<string | null> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("photos").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) {
    console.error("Photo upload failed", error);
    return null;
  }
  const { data } = await supabase.storage.from("photos").createSignedUrl(path, 60 * 60 * 24 * 365);
  return data?.signedUrl ?? null;
}
