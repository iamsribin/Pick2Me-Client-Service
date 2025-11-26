import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  GoogleMap,
  Marker,
  Autocomplete,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { useJsApiLoader } from "@react-google-maps/api";
import { Player } from "@lottiefiles/react-lottie-player";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/shared/services/redux/store";
import { BackendVehicle, VehicleOption } from "./type";
import { coordinatesToAddress } from "@/shared/utils/locationToAddress";
import { fetchData, postData } from "@/shared/services/api/api-service";
import ApiEndpoints from "@/constants/user-api-end-pointes";
import { CommonApiEndPoint } from "@/constants/common-api-ent-point";
import { ResponseCom } from "@/shared/types/common";
import { toast } from "@/shared/hooks/use-toast";
import { handleCustomError } from "@/shared/utils/error";
import {
  mapContainerStyle,
  mapOptions,
  libraries,
} from "@/constants/map-options";
import { calculateDistance } from "@/shared/utils/getDistanceInMeters";
import { getCurrentLocation } from "@/shared/utils/getCurrentLocation";
import { MapPin, Search } from "lucide-react"; // Assuming you use lucide-react with shadcn

interface OnlineDriver {
  driverId: string;
  lat: number;
  lng: number;
  distanceKm: number;
  vehicleModel: string;
  bearing?: number;
}

const RideBooking: React.FC = () => {
  // --- Existing State ---
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: 13.003371,
    lng: 77.589134,
  });
  const [zoom, setZoom] = useState<number>(9);
  const [origin, setOrigin] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [distanceInfo, setDistanceInfo] = useState<{
    distance: string;
    duration: string;
    distanceInKm: number;
  } | null>(null);

  const [nearbyDrivers, setNearbyDrivers] = useState<OnlineDriver[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [showVehicleSheet, setShowVehicleSheet] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [useCurrentLocationAsPickup, setUseCurrentLocationAsPickup] =
    useState<boolean>(false);

  // --- New State for Map Picker ---
  const [isMapPickingMode, setIsMapPickingMode] = useState<boolean>(false);
  const [tempPickupLocation, setTempPickupLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [tempPickupAddress, setTempPickupAddress] = useState<string>("");
  const [isResolvingAddress, setIsResolvingAddress] = useState<boolean>(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const originRef = useRef<HTMLInputElement>(null);
  const destinationRef = useRef<HTMLInputElement>(null);

  const { user } = useSelector((state: RootState) => ({ user: state.user }));
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_API_KEY,
    libraries,
  });

  const fetchNearbyDrivers = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await fetchData<{ drivers: OnlineDriver[] }>(
        `${ApiEndpoints.GET_NEARBY_DRIVERS}?lat=${lat}&lng=${lng}&radius=100`
      );

      if (response?.data?.drivers) {
        setNearbyDrivers(response.data.drivers);
      }
    } catch (error) {
      handleCustomError(error);
    }
  }, []);

  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const userLocation = await getCurrentLocation();
        setUserLocation({
          lat: userLocation.latitude,
          lng: userLocation.longitude,
        });
        setCenter({ lat: userLocation.latitude, lng: userLocation.longitude });
        fetchNearbyDrivers(userLocation.latitude, userLocation.longitude);
      } catch (error: any) {
        toast({ description: error.message, variant: "error" });
      }
    };
    getUserLocation();

    const intervalId = setInterval(() => {
      if (userLocation) fetchNearbyDrivers(userLocation.lat, userLocation.lng);
    }, 15000);

    return () => clearInterval(intervalId);
  }, [fetchNearbyDrivers]);

  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (!isMapPickingMode || !e.latLng) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    setTempPickupLocation({ lat, lng });
    setIsResolvingAddress(true);

    try {
      const address = await coordinatesToAddress(lat, lng);
      setTempPickupAddress(address);
    } catch (error) {
      setTempPickupAddress("Unknown location");
      toast({
        description: "Could not fetch address for this location",
        variant: "error",
      });
    } finally {
      setIsResolvingAddress(false);
    }
  };

  const confirmMapSelection = () => {
    if (!tempPickupLocation || !tempPickupAddress) return;

    setOrigin(tempPickupAddress);

    setUseCurrentLocationAsPickup(false);

    setUserLocation(tempPickupLocation);
    setCenter(tempPickupLocation);

    setIsMapPickingMode(false);
    setTempPickupLocation(null);

    originRef.current?.focus?.();
  };

  const cancelMapSelection = () => {
    setIsMapPickingMode(false);
    setTempPickupLocation(null);
    setTempPickupAddress("");
  };

  const enableMapPicker = () => {
    setIsMapPickingMode(true);
    toast({ description: "Tap on the map to select your pickup spot" });
  };

  const fetchRouteAndVehicles = async () => {
    if (!origin || !destination) {
      toast({ description: "Please enter valid locations", variant: "error" });
      return;
    }
    if (loading) return;
    setLoading(true);

    const directionsService = new google.maps.DirectionsService();

    try {
      const request: google.maps.DirectionsRequest = {
        origin: origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      };

      const result = await directionsService.route(request);

      setDirections(result);
      const route = result.routes[0];
      const leg = route?.legs[0];

      if (leg) {
        const distInMeters = leg.distance?.value ?? 0;
        const distInKm = distInMeters / 1000;

        const routeStartLat = leg.start_location.lat();
        const routeStartLng = leg.start_location.lng();

        setDistanceInfo({
          distance: leg.distance?.text ?? "Unknown",
          duration: leg.duration?.text ?? "Unknown",
          distanceInKm: distInKm,
        });

        await calculateVehiclePricingAndAvailability(
          distInKm,
          routeStartLat,
          routeStartLng
        );
      }
    } catch (error) {
      toast({ description: "Could not calculate route", variant: "error" });
    }
  };

  const calculateVehiclePricingAndAvailability = async (
    tripDistanceKm: number,
    pickupLat: number,
    pickupLng: number
  ) => {
    try {
      const data = await fetchData<BackendVehicle[]>(
        CommonApiEndPoint.VEHICLE_MODELS
      );

      await fetchNearbyDrivers(pickupLat, pickupLng);

      const processedVehicles: VehicleOption[] =
        data?.data.map((vehicle) => {
          const estimatedPrice = Math.ceil(
            vehicle.basePrice + vehicle.pricePerKm * tripDistanceKm
          );

          const isAvailable = nearbyDrivers.some((driver) => {
            const driverDist = calculateDistance(
              pickupLat,
              pickupLng,
              driver.lat,
              driver.lng
            );

            return (
              driver.vehicleModel.toLowerCase() ===
                vehicle.vehicleModel.toLowerCase() && driverDist <= 5000
            );
          });

          return {
            id: vehicle.vehicleModel.toLowerCase(),
            name: vehicle.vehicleModel,
            image: vehicle.image,
            price: estimatedPrice,
            pricePerKm: vehicle.pricePerKm,
            eta: isAvailable ? vehicle.eta : "No drivers nearby",
            features: vehicle.features,
            isAvailable: isAvailable,
          };
        }) || [];

      setVehicles(processedVehicles);
      setShowVehicleSheet(true);
    } catch (error) {
      toast({ description: "Failed to load vehicle options" });
    } finally {
      setLoading(false);
    }
  };

  const handleCurrentLocationCheck = async (checked: boolean) => {
    setLoading(true);
    setUseCurrentLocationAsPickup(checked);

    if (checked) {
      try {
        const gps = await getCurrentLocation();
        const newLoc = { lat: gps.latitude, lng: gps.longitude };
        setUserLocation(newLoc);

        const address = await coordinatesToAddress(newLoc.lat, newLoc.lng);
        setOrigin(address);
        if (originRef.current) originRef.current.value = address;

        setCenter(newLoc);
      } catch (e) {
        toast({
          description: "Could not get current location",
          variant: "error",
        });
      }
    } else {
      setOrigin("");
      if (originRef.current) originRef.current.value = "";
    }
    setLoading(false);
  };

  const handleBookRide = async () => {
    if (!selectedVehicle || !distanceInfo || !directions) return;

    const selectedVehicleData = vehicles.find((v) => v.id === selectedVehicle);
    if (!selectedVehicleData?.isAvailable) {
      toast({
        description: "This vehicle type is no longer available nearby.",
      });
      return;
    }
    if (user.loggedIn) {
      toast({
        description:
          "You're not logged in. Please register before booking a ride.",
        variant: "error",
      });
      return;
    }

    setIsSearching(true);

    try {
      const leg = directions.routes[0].legs[0];
      const bookingPayload = {
        pickupLocation: {
          address: leg.start_address,
          latitude: leg.start_location.lat(),
          longitude: leg.start_location.lng(),
        },
        dropOffLocation: {
          address: leg.end_address,
          latitude: leg.end_location.lat(),
          longitude: leg.end_location.lng(),
        },
        vehicleModel: selectedVehicleData.name,
        // userName: user.user,
        estimatedPrice: selectedVehicleData.price,
        estimatedDuration: distanceInfo.duration,
        distanceInfo: {
          distance: distanceInfo.distance,
          distanceInKm: distanceInfo.distanceInKm,
        },
        // mobile: user.mobile,
        // profile: user.profile
      };

      const response = await postData<ResponseCom["data"]>(
        ApiEndpoints.BOOK_MY_CAB,
        bookingPayload
      );

      if (response?.status === 201 || response?.status === 200) {
        toast({ description: "Ride request sent!", variant: "success" });
        setShowVehicleSheet(false);
        // Navigate to ride tracking page or show waiting UI
      }
    } catch (e) {
      toast({ description: "Booking failed" });
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setOrigin("");
    setDestination("");
    setDirections(null);
    setVehicles([]);
    setSelectedVehicle(null);
    setShowVehicleSheet(false);
    setUseCurrentLocationAsPickup(false);
    setIsMapPickingMode(false);
    setTempPickupLocation(null);
    if (originRef.current) originRef.current.value = "";
    if (destinationRef.current) destinationRef.current.value = "";
    if (userLocation) fetchNearbyDrivers(userLocation.lat, userLocation.lng);
  };

  if (!isLoaded) return <div className="text-white">Loading Map...</div>;

  return (
    <section className="py-20 bg-gradient-to-br from-black to-gray-800 h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col relative">
        {/* Map Area */}
        <div className="flex-1 w-full rounded-xl overflow-hidden shadow-xl relative">
          <GoogleMap
            center={center}
            zoom={zoom}
            mapContainerStyle={mapContainerStyle}
            options={{
              ...mapOptions,
              draggableCursor: isMapPickingMode ? "crosshair" : "default",
              clickableIcons: false,
            }}
            onClick={handleMapClick}
          >
            {userLocation && !tempPickupLocation && (
              <Marker
                position={userLocation}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: "#4285F4",
                  fillOpacity: 1,
                  strokeWeight: 2,
                  strokeColor: "white",
                }}
              />
            )}

            {tempPickupLocation && (
              <Marker
                position={tempPickupLocation}
                animation={google.maps.Animation.DROP}
                draggable={true}
                onDragEnd={(e) =>
                  handleMapClick(e as google.maps.MapMouseEvent)
                }
              />
            )}

            {/* Direction Route */}
            {directions && <DirectionsRenderer directions={directions} />}

            {/* Online Driver Markers (Hide when picking location to reduce clutter) */}
            {!isMapPickingMode &&
              nearbyDrivers.map((driver) => (
                <Marker
                  key={driver.driverId}
                  position={{ lat: driver.lat, lng: driver.lng }}
                  icon={{
                    url: "/images/taxi.png",
                    scaledSize: new google.maps.Size(45, 45),
                  }}
                />
              ))}
          </GoogleMap>

          {/* --- 1. SEARCH OVERLAY (Hidden when Map Picking Mode is ON) --- */}
          {!isMapPickingMode && (
            <div className="absolute top-4 left-4 right-4 bg-gray-900/95 backdrop-blur-md rounded-xl shadow-lg p-4 md:w-96 border border-gray-700 z-10">
              <div className="space-y-4">
                {/* Toggle Current Location */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={useCurrentLocationAsPickup}
                      onCheckedChange={handleCurrentLocationCheck}
                    />
                    <Label className="text-gray-300 text-xs">
                      Current Location as pickup
                    </Label>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0 bg-gray-800 border-gray-600 hover:bg-gray-700"
                      onClick={enableMapPicker}
                      title="Set on Map"
                    >
                      <MapPin className="h-4 w-4 text-white" />
                    </Button>
                    <Label className="text-gray-300 text-xs">
                      set pickup location at map
                    </Label>
                  </div>
                </div>

                {/* Origin Input Group */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Autocomplete
                      onLoad={(autocomplete) => {
                        autocomplete.addListener("place_changed", () => {
                          const place = autocomplete.getPlace();
                          setOrigin(place.formatted_address || "");
                          setUseCurrentLocationAsPickup(false);
                        });
                      }}
                    >
                      <Input
                        ref={originRef}
                        value={origin}
                        placeholder={loading ? "loading..." : "Pickup Location"}
                        className="bg-gray-800 text-white"
                        onChange={(e) => setOrigin(e.target.value)}
                      />
                    </Autocomplete>
                  </div>
                  {/* Button to Trigger Map Picker */}
                </div>

                {/* Destination Input */}
                <Autocomplete
                  onLoad={(autocomplete) => {
                    autocomplete.addListener("place_changed", () => {
                      const place = autocomplete.getPlace();
                      setDestination(place.formatted_address || "");
                    });
                  }}
                >
                  <Input
                    ref={destinationRef}
                    placeholder="Destination"
                    className="bg-gray-800 text-white"
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </Autocomplete>

                <div className="flex gap-2">
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={fetchRouteAndVehicles}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Find Ride"}
                  </Button>
                  <Button
                    variant="outline"
                    className="text-black bg-white"
                    onClick={handleClear}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* --- 2. MAP PICKER CONFIRMATION OVERLAY (Visible ONLY when Map Picking Mode is ON) --- */}
          {isMapPickingMode && (
            <div className="absolute bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[400px] z-20">
              <Card className="bg-gray-900 border-gray-700 text-white shadow-2xl">
                <CardContent className="p-4 space-y-4">
                  <div className="text-center">
                    <h3 className="font-semibold text-lg text-blue-400">
                      Choose your pickup spot
                    </h3>
                    <p className="text-sm text-gray-400 mt-1 min-h-[40px] flex items-center justify-center">
                      {isResolvingAddress
                        ? "Fetching address..."
                        : tempPickupAddress || "Tap on map to place pin"}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={!tempPickupLocation || isResolvingAddress}
                      onClick={confirmMapSelection}
                    >
                      Confirm Pickup
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={cancelMapSelection}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Vehicle Selection Sheet */}
        <Sheet open={showVehicleSheet} onOpenChange={setShowVehicleSheet}>
          <SheetContent
            side="bottom"
            className="w-full max-w-md mx-auto rounded-t-2xl bg-gray-900 border-gray-700 text-white overflow-y-auto max-h-[70vh]"
          >
            <SheetHeader>
              <SheetTitle className="text-white">Select Vehicle</SheetTitle>
              {distanceInfo && (
                <p className="text-gray-400 text-sm">
                  {distanceInfo.distance} • {distanceInfo.duration}
                </p>
              )}
            </SheetHeader>

            <div className="mt-4 space-y-3">
              {vehicles.map((v) => (
                <Card
                  key={v.id}
                  onClick={() => v.isAvailable && setSelectedVehicle(v.id)}
                  className={`bg-gray-800 border-gray-700 transition-all ${
                    selectedVehicle === v.id
                      ? "border-blue-500 ring-1 ring-blue-500"
                      : ""
                  } ${
                    !v.isAvailable
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer hover:bg-gray-700"
                  }`}
                >
                  <CardContent className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <img
                        src={v.image}
                        alt={v.name}
                        className="w-16 h-10 object-contain"
                      />
                      <div>
                        <h3 className="font-bold">{v.name}</h3>
                        <p className="text-xs text-gray-400">
                          {v.isAvailable ? v.eta : "Unavailable nearby"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">${v.price}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="sticky bottom-0 bg-gray-900 pt-4 mt-4 border-t border-gray-700">
              <Button
                className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedVehicle || isSearching}
                onClick={handleBookRide}
              >
                {isSearching ? (
                  <Player autoplay loop src="..." style={{ height: 30 }} />
                ) : (
                  "Book Ride"
                )}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </section>
  );
};

export default RideBooking;
