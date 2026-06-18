import { supabase } from "@/integrations/supabase/client";

const ALLOWED_MIME = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/gif", "gif"],
  ["image/webp", "webp"],
]);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function uploadPhoto(file: File, userId: string, folder: string): Promise<string | null> {
  const mime = (file.type || "").toLowerCase();
  if (!ALLOWED_MIME.has(mime)) {
    console.error("Photo upload rejected: unsupported file type", mime);
    return null;
  }
  if (file.size > MAX_BYTES) {
    console.error("Photo upload rejected: file too large", file.size);
    return null;
  }
  const ext = ALLOWED_MIME.get(mime)!;
  const path = `${userId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("photos").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: mime,
  });
  if (error) {
    console.error("Photo upload failed", error);
    return null;
  }
  const { data } = await supabase.storage.from("photos").createSignedUrl(path, 60 * 60 * 24 * 365);
  return data?.signedUrl ?? null;
}
