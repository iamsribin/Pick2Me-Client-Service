import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../services/redux/store';

export function DriverMarker({ rideId }: { rideId: string }) {
  const latest = useSelector((s: RootState) => s.RideData.latest[rideId]);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!latest) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([latest.lat, latest.lng]);
      markerRef.current.setRotationAngle(latest.heading ?? 0);
    }
  }, [latest]);

  return <div id={`marker-${rideId}`} />;
}
