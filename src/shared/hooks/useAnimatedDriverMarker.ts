import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/shared/services/redux/store';
import { DriverLocationMessage } from '@/shared/types/common';

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

export function useAnimatedDriverMarker(rideId: string | undefined) {
  const positions = useSelector((s: RootState) => (rideId ? s.RideData.positions[rideId] ?? [] : []));
  const [displayPos, setDisplayPos] = useState<{lat:number;lng:number;heading?:number} | null>(null);

  const animRef = useRef<{start:number; duration:number; from:any; to:any} | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!positions || positions.length === 0) return;
    // If no ongoing animation, start animating to latest point.
    const latest = positions[positions.length - 1];
    const prev = positions[positions.length - 2] ?? latest;
    // Use timestamps to compute expected duration (serverTs or device ts)
    const t0 = prev.serverTs ?? prev.ts ?? Date.now() - 1000;
    const t1 = latest.serverTs ?? latest.ts ?? Date.now();
    let duration = Math.max(100, Math.min(2000, t1 - t0)); // clamp to [100,2000] ms
    // if t1 - t0 is 0 (same timestamp) fallback to 300ms
    if (t1 - t0 <= 0) duration = 300;

    animRef.current = {
      start: performance.now(),
      duration,
      from: displayPos ?? { lat: prev.lat, lng: prev.lng, heading: prev.heading },
      to: { lat: latest.lat, lng: latest.lng, heading: latest.heading },
    };

    function step(now: number) {
      const a = animRef.current;
      if (!a) return;
      const p = Math.min(1, (now - a.start) / a.duration);
      const eased = p < 0.5 ? 2*p*p : -1 + (4 - 2*p)*p; // simple ease
      const lat = lerp(a.from.lat, a.to.lat, eased);
      const lng = lerp(a.from.lng, a.to.lng, eased);
      const heading = a.to.heading ?? a.from.heading;
      setDisplayPos({ lat, lng, heading });

      if (p < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        animRef.current = null;
      }
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);

    // cleanup on unmount
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
  }, [positions]); // eslint-disable-line

  return displayPos;
}
