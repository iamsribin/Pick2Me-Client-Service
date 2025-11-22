import { Coordinates } from "@/shared/types/common";

export const parseCoords = (coords: Coordinates | undefined): [number, number] | null => {
  if (!coords) return null;
  const lat = typeof coords.latitude === "string" ? parseFloat(coords.latitude) : coords.latitude;
  const lng = typeof coords.longitude === "string" ? parseFloat(coords.longitude) : coords.longitude;
  if (isNaN(lat) || isNaN(lng)) {
    console.warn("Invalid coordinates:", { lat, lng });
    return null;
  }
  return [lng, lat];
};

export const createVehicleIcon = (): HTMLElement => {
  const el = document.createElement("div");
  el.className = "vehicle-marker";
  el.innerHTML = `
    <div style="
      width: 32px;
      height: 32px;
      background: #10b981;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      border: 2px solid white;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v1c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
      </svg>
    </div>
  `;
  return el;
};