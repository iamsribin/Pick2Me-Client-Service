import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { emitSocket } from '@/shared/utils/emitSocket';
import { toast } from '@/shared/hooks/use-toast';

interface LocationTrackingOptions {
  isTracking: boolean;
  updateIntervalMs?: number; 
  highAccuracy?: boolean;
}

interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export const useLocationTracking = ({
  isTracking,
  updateIntervalMs = 10000, // Default: 10 seconds
  highAccuracy = true,
}: LocationTrackingOptions) => {
  const dispatch = useDispatch();
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const lastLocationRef = useRef<LocationUpdate | null>(null);
  const isTrackingRef = useRef(isTracking);

  useEffect(() => {
    isTrackingRef.current = isTracking;
  }, [isTracking]);

  // Throttled location update sender
  const sendLocationUpdate = useCallback(
    (location: LocationUpdate) => {
      const now = Date.now();
      
      if (now - lastUpdateRef.current < updateIntervalMs) {
        return;
      }

      if (lastLocationRef.current) {
        const distance = calculateDistance(
          lastLocationRef.current.latitude,
          lastLocationRef.current.longitude,
          location.latitude,
          location.longitude
        );
        
        // If moved less than 10 meters and less than 30 seconds, skip update
        if (distance < 10 && now - lastUpdateRef.current < 30000) {
          return;
        }
      }

      // Send location update via socket
      dispatch(
        emitSocket('driver:location:update', {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: location.timestamp,
        })
      );

      lastUpdateRef.current = now;
      lastLocationRef.current = location;
    },
    [dispatch, updateIntervalMs]
  );

  // Start tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        description: 'Geolocation is not supported by your browser',
        variant: 'error',
      });
      return false;
    }

    const options: PositionOptions = {
      enableHighAccuracy: highAccuracy,
      timeout: 10000,
      maximumAge: 5000, // Accept cached position up to 5 seconds old
    };

    const successHandler = (position: GeolocationPosition) => {
      if (!isTrackingRef.current) return;

      const locationData: LocationUpdate = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };

      sendLocationUpdate(locationData);
    };

    const errorHandler = (error: GeolocationPositionError) => {
      console.error('Location error:', error);
      
      let message = 'Unable to get your location';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Location permission denied. Please enable location access.';
          break;
        case error.POSITION_UNAVAILABLE:
          message = 'Location information unavailable';
          break;
        case error.TIMEOUT:
          message = 'Location request timed out';
          break;
      }

      toast({ description: message, variant: 'error' });
    };

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        successHandler,
        errorHandler,
        options
      );
      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }, [highAccuracy, sendLocationUpdate]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      lastUpdateRef.current = 0;
      lastLocationRef.current = null;
    }
  }, []);

  // Handle tracking state changes
  useEffect(() => {
    if (isTracking) {
      startTracking();
    } else {
      stopTracking();
    }

    // Cleanup on unmount
    return () => {
      stopTracking();
    };
  }, [isTracking, startTracking, stopTracking]);

  return {
    startTracking,
    stopTracking,
    lastLocation: lastLocationRef.current,
  };
};

// Haversine formula to calculate distance between two coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}