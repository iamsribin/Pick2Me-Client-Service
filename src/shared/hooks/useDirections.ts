import { useState, useEffect } from "react";
import { RideDetails } from "../types/common";

const useDirections = (
  rideDetails: RideDetails,
  driverLocation: any,
  status: string,
  isLoaded: boolean
) => {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [center, setCenter] = useState({ lat: 0, lng: 0 });
  const [zoom, setZoom] = useState(9);

  useEffect(() => {
    if (!isLoaded || !driverLocation) return;

    // Set center
    if (status === "Accepted" || status === "InRide") {
      if (rideDetails.pickupCoordinates) {
        setCenter({
          lat: rideDetails.pickupCoordinates.latitude,
          lng: rideDetails.pickupCoordinates.longitude,
        });
        setZoom(15);
      }
    } else {
      setCenter({ lat: driverLocation.lat, lng: driverLocation.lng });
      setZoom(9);
    }

    // Directions
    const origin =
      status === "Accepted" || status === "InRide"
        ? { lat: driverLocation.lat, lng: driverLocation.lng }
        : null;

    const destination =
      status === "Accepted"
        ? {
            lat: rideDetails.pickupCoordinates.latitude,
            lng: rideDetails.pickupCoordinates.longitude,
          }
        : status === "InRide"
        ? {
            lat: rideDetails.dropOffCoordinates.latitude,
            lng: rideDetails.dropOffCoordinates.longitude,
          }
        : null;

    if (origin && destination) {
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin,
          destination,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK" && result) {
            setDirections(result);
          }
        }
      );
    }
  }, [driverLocation, status, rideDetails, isLoaded]);

  return { directions, center, zoom };
};

export default useDirections;