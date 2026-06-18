import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  kind: "feeding-fresh" | "feeding-stale" | "feeding-old" | "injury" | "animal" | "me";
  popup?: string;
  onClick?: () => void;
}

interface MapViewProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  onMapClick?: (lat: number, lng: number) => void;
  height?: string;
}

const colors: Record<MapMarker["kind"], string> = {
  "feeding-fresh": "#16a34a",
  "feeding-stale": "#eab308",
  "feeding-old": "#ef4444",
  injury: "#dc2626",
  animal: "#FF6B35",
  me: "#1A535C",
};

function makeIcon(kind: MapMarker["kind"]) {
  const c = colors[kind];
  const inner = kind === "injury" ? "+" : kind === "animal" ? "🐾" : kind === "me" ? "●" : "🍽";
  return L.divIcon({
    className: "pati-marker",
    html: `<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${c};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:14px;color:white;font-weight:700;">${inner}</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -28],
  });
}

export function MapView({ center, zoom = 15, markers = [], onMapClick, height = "100%" }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true }).setView(center, zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    if (onMapClick) {
      map.on("click", (e) => onMapClick(e.latlng.lat, e.latlng.lng));
    }
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mapRef.current) mapRef.current.setView(center, zoom);
  }, [center, zoom]);

  useEffect(() => {
    if (!markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();
    markers.forEach((m) => {
      const marker = L.marker([m.lat, m.lng], { icon: makeIcon(m.kind) });
      if (m.popup) marker.bindPopup(m.popup);
      if (m.onClick) marker.on("click", m.onClick);
      markersLayerRef.current!.addLayer(marker);
    });
  }, [markers]);

  return <div ref={containerRef} style={{ height, width: "100%" }} className="z-0" />;
}
