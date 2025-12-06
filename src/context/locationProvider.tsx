import React, {
  createContext,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { emitSocket } from "@/shared/utils/emitSocket";
import { toast } from "@/shared/hooks/use-toast";
import { RootState, store } from "@/shared/services/redux/store";
import { calculateDistance } from "@/shared/utils/getDistanceInMeters";

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface LocationContextValue {
  lastLocation: LocationUpdate | null;
}

export const LocationContext = createContext<LocationContextValue | undefined>(
  undefined
);

interface LocationProviderProps {
  children: ReactNode;
  autoSyncWithRedux?: boolean;
  updateIntervalMs?: number;
  highAccuracy?: boolean;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({
  children,
  autoSyncWithRedux = true,
  updateIntervalMs = 10000,
  highAccuracy = true,
}) => {
  const dispatch = useDispatch();
  const isOnline = useSelector((s: RootState) => s.user.isOnline);
  const rideData = useSelector((s: RootState) => s.RideData);

  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const lastLocationRef = useRef<LocationUpdate | null>(null);
  const isTrackingRef = useRef<boolean>(!!isOnline);

  const getKey = (isHeartbeat = true) => {
    console.log("rideData==",rideData); 
    
    if (isHeartbeat) {
      return rideData.status ? "inride:driver:heartbeat" : "driver:heartbeat";
    } else {
      return rideData.status
        ? "inride:driver:location:update"
        : "driver:location:update";
    }
  }; 

  useEffect(() => {
    isTrackingRef.current = !!isOnline;
  }, [isOnline]);

  useEffect(() => {
    if (autoSyncWithRedux && !isOnline) return;

    const heartbeatInterval = setInterval(() => {
      store.dispatch(
        emitSocket(getKey(), {
          timestamp: Date.now(),
          location: lastLocationRef.current,
        }) as any
      );
    }, 60000);

    return () => clearInterval(heartbeatInterval);
  }, [autoSyncWithRedux, isOnline]);

  const sendLocationUpdate = useCallback(
    (location: LocationUpdate) => {
      const now = Date.now();

      // if (now - lastUpdateRef.current < updateIntervalMs) return;

      if (lastLocationRef.current) {
        const distance = calculateDistance(
          lastLocationRef.current.latitude,
          lastLocationRef.current.longitude,
          location.latitude,
          location.longitude
        );

        // If moved less than 10 meters and less than 30 seconds, skip update
        // if (distance < 10 && now - lastUpdateRef.current < 30000) return;
      }
// 10.892027, 75.998486
      dispatch(
        emitSocket(getKey(false), {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy, 
          timestamp: location.timestamp,
          rideId : rideData.status ? rideData.rideDetails.rideId:"",
          userId: rideData.rideDetails.user.userId
        }) as any
      );

      lastUpdateRef.current = now;
      lastLocationRef.current = location;
    },
    [dispatch, updateIntervalMs]
  );

  const startTracking = useCallback((): boolean => {
    if (!navigator.geolocation) {
      toast({
        description: "Geolocation is not supported by your browser",
        variant: "error",
      });
      return false;
    }

    const options: PositionOptions = {
      enableHighAccuracy: highAccuracy,
      timeout: 10000,
      maximumAge: 5000,
    };

    const successHandler = (position: GeolocationPosition) => {
      if (!isTrackingRef.current && autoSyncWithRedux) return;

      const locationData: LocationUpdate = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };

      sendLocationUpdate(locationData);
    };

    const errorHandler = (error: GeolocationPositionError) => {
      console.error("Location error:", error);

      let message = "Unable to get your location";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message =
            "Location permission denied. Please enable location access.";
          break;
        case error.POSITION_UNAVAILABLE:
          message = "Location information unavailable";
          break;
        case error.TIMEOUT:
          message = "Location request timed out";
          break;
      }

      toast({ description: message, variant: "error" });
    };

    try {
      isTrackingRef.current = true;
      watchIdRef.current = navigator.geolocation.watchPosition(
        successHandler,
        errorHandler,
        options
      );
      return true;
    } catch (error) {
      console.error("Error starting location tracking:", error);
      return false;
    }
  }, [highAccuracy, sendLocationUpdate, autoSyncWithRedux]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    lastUpdateRef.current = 0;
    lastLocationRef.current = null;
    isTrackingRef.current = false;
  }, []);

  useEffect(() => {
    if (!autoSyncWithRedux) return;

    if (isOnline) startTracking();
    else stopTracking();

    return () => {
      stopTracking();
    };
  }, [isOnline, autoSyncWithRedux, startTracking, stopTracking]);

  const value: LocationContextValue = {
    lastLocation: lastLocationRef.current,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
