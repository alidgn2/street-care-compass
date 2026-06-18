// Helper utilities
export function escapeHtml(input: string | null | undefined): string {
  if (input == null) return "";
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "az önce";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün önce`;
  return date.toLocaleDateString("tr-TR");
}

export function feedingFreshness(dateString: string): "fresh" | "stale" | "old" {
  const hours = (Date.now() - new Date(dateString).getTime()) / 1000 / 3600;
  if (hours < 12) return "fresh";
  if (hours < 24) return "stale";
  return "old";
}

export async function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Tarayıcınız konum desteklemiyor"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.message || "Konum alınamadı")),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}

interface NominatimResult {
  address?: {
    road?: string;
    pedestrian?: string;
    neighbourhood?: string;
    suburb?: string;
    quarter?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
  };
  display_name?: string;
}

export async function reverseGeocode(lat: number, lng: number): Promise<{
  street: string | null;
  neighborhood: string | null;
  city: string | null;
}> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=tr`,
      { headers: { "Accept": "application/json" } },
    );
    const data = (await res.json()) as NominatimResult;
    const a = data.address ?? {};
    return {
      street: a.road ?? a.pedestrian ?? null,
      neighborhood: a.neighbourhood ?? a.suburb ?? a.quarter ?? null,
      city: a.city ?? a.town ?? a.village ?? a.state ?? null,
    };
  } catch {
    return { street: null, neighborhood: null, city: null };
  }
}
