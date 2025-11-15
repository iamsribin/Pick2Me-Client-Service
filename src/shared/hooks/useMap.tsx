import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { toast } from "sonner";
import { parseCoords, createVehicleIcon } from "@/shared/utils/mapUtils";
import { RideRequest } from "../types/driver/ride-type";
// import { useDriverLocation } from "@/context/driver-location-context";
import { Feature, LineString } from "geojson"; 

mapboxgl.accessToken = import.meta.env.VITE_MAP_BOX_ACCESS_TOKEN;

const useMap = (rideData: RideRequest | null) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const driverMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const pickupMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const dropoffMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapReady, setMapReady] = useState<boolean>(false);
  const [isTripStarted, setIsTripStarted] = useState<boolean>(false);

  // const { driverLocation } = useDriverLocation();

  const driverLocation = {longitude:9090,latitude:900}

  useEffect(() => {
    if (!rideData) return;
    setIsTripStarted(
      rideData.bookingDetails.status === "started" || rideData.bookingDetails.status === "completed"
    );
  }, [rideData]);

  useEffect(() => {
    if (!mapContainerRef.current || !rideData || mapInstanceRef.current) return;

    if (!import.meta.env.VITE_MAP_BOX_ACCESS_TOKEN) {
      toast.error("Mapbox access token is missing.");
      return;
    }
console.log("driverLocation",driverLocation);

    if (!driverLocation) {
      toast.error("Driver location loading...");
      console.log("Driver location missing..");
      return;
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [driverLocation.longitude, driverLocation.latitude],
      zoom: 12,
      attributionControl: false,
      interactive: true,
    });

    mapInstanceRef.current = map;

    map.on("load", () => {
      setMapReady(true);

      driverMarkerRef.current = new mapboxgl.Marker({
        element: createVehicleIcon(),
        anchor: "center",
      })
        .setLngLat([driverLocation.longitude, driverLocation.latitude])
        .addTo(map);

      if (!isTripStarted) {
        const pickupCoords = parseCoords(rideData.bookingDetails.pickupLocation);
        console.log("pickupCoords",pickupCoords);
        
        if (pickupCoords) {
          pickupMarkerRef.current = new mapboxgl.Marker({
            color: "#ef4444",
            scale: 0.8,
          })
            .setLngLat(pickupCoords)
            .addTo(map);
        }
      }

      const dropoffCoords = parseCoords(rideData.bookingDetails.dropoffLocation);
      if (dropoffCoords) {
        dropoffMarkerRef.current = new mapboxgl.Marker({
          color: "#3b82f6",
          scale: 0.8,
        })
          .setLngLat(dropoffCoords)
          .addTo(map);
      }

      adjustMapBounds(map, rideData, isTripStarted, driverLocation);
      fetchTripRoute(map, rideData, isTripStarted, driverLocation);
    });

    map.on("error", (e) => {
      console.error("Mapbox error:", e);
      toast.error("Failed to load map");
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setMapReady(false);
      }
    };
  }, [rideData, isTripStarted, driverLocation]);

  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady || !rideData || !driverLocation) return;

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLngLat([driverLocation.longitude, driverLocation.latitude]);
    }

    if (isTripStarted && pickupMarkerRef.current) {
      pickupMarkerRef.current.remove();
      pickupMarkerRef.current = null;
    } else if (!isTripStarted && !pickupMarkerRef.current) {
      const pickupCoords = parseCoords(rideData.bookingDetails.pickupLocation);
      if (pickupCoords) {
        pickupMarkerRef.current = new mapboxgl.Marker({
          color: "#ef4444",
          scale: 0.8,
        })
          .setLngLat(pickupCoords)
          .addTo(mapInstanceRef.current);
      }
    }

    adjustMapBounds(mapInstanceRef.current, rideData, isTripStarted, driverLocation);
    fetchTripRoute(mapInstanceRef.current, rideData, isTripStarted, driverLocation);
  }, [rideData, isTripStarted, mapReady, driverLocation]);

  return { mapContainerRef, mapReady };
};

const adjustMapBounds = (
  map: mapboxgl.Map,
  rideData: RideRequest,
  isTripStarted: boolean,
  driverLocation: { latitude: number; longitude: number }
) => {
  if (!driverLocation || !rideData) return;

  const bounds = new mapboxgl.LngLatBounds(
    [driverLocation.longitude, driverLocation.latitude],
    [driverLocation.longitude, driverLocation.latitude]
  );

  if (!isTripStarted) {
    const pickupCoords = parseCoords(rideData.bookingDetails.pickupLocation);
    if (pickupCoords) bounds.extend(pickupCoords);
  }

  const dropoffCoords = parseCoords(rideData.bookingDetails.dropoffLocation);
  if (dropoffCoords) bounds.extend(dropoffCoords);

  try {
    map.fitBounds(bounds, {
      padding: { top: 80, bottom: 320, left: 50, right: 50 },
      maxZoom: 15,
      duration: 1000,
    });
  } catch (error) {
    console.error("Error adjusting map bounds:", error);
  }
};

const fetchTripRoute = async (
  map: mapboxgl.Map,
  rideData: RideRequest,
  isTripStarted: boolean,
  driverLocation: { latitude: number; longitude: number }
) => {
  let destinationCoords: [number, number] | null = null;
  if (!isTripStarted) {
    destinationCoords = parseCoords(rideData.bookingDetails.pickupLocation);
  } else {
    destinationCoords = parseCoords(rideData.bookingDetails.dropoffLocation);
  }

  if (!destinationCoords) {
    console.warn("No valid destination coordinates for route");
    return;
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${driverLocation.longitude},${driverLocation.latitude};${destinationCoords[0]},${destinationCoords[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];

      const routeData: Feature<LineString> = {
        type: "Feature",
        properties: {},
        geometry: route.geometry,
      };

      const routeSource = map.getSource("route");
      if (routeSource) {
        (routeSource as mapboxgl.GeoJSONSource).setData(routeData);
      } else {
        map.addSource("route", {
          type: "geojson",
          data: routeData,
        });

        map.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": isTripStarted ? "#3b82f6" : "#10b981",
            "line-width": 5,
            "line-opacity": 0.8,
          },
        });
      }
    } else {
      console.warn("No routes found");
    }
  } catch (error) {
    console.error("Error fetching route:", error);
  }
};

export default useMap;
