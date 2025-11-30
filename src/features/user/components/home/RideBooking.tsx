import React, { useEffect, useRef, useState, useCallback } from "react";
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
import {
  MapPin,
  Navigation,
  Star,
  Plus,
  Save,
  X,
  LoaderIcon,
} from "lucide-react";
import UserApiEndpoints from "@/constants/user-api-end-pointes";
import { rideCreate } from "@/shared/services/redux/slices/rideSlice";

interface OnlineDriver {
  driverId: string;
  lat: number;
  lng: number;
  distanceKm: number;
  vehicleModel: string;
  bearing?: number;
}

interface SavedPlace {
  id?: string;
  name: string;
  coordinates: { latitude: number; longitude: number };
  address: string;
}

const RideBooking: React.FC = () => {
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: 13.003371,
    lng: 77.589134,
  });
  const [zoom, setZoom] = useState<number>(9);

  // Location States
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
 const dispatch = useDispatch()
  const [nearbyDrivers, setNearbyDrivers] = useState<OnlineDriver[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [showVehicleSheet, setShowVehicleSheet] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [useCurrentLocationAsPickup, setUseCurrentLocationAsPickup] =
    useState<boolean>(false);


  const blurTimeoutRef = useRef<number | null>(null);
  const savedPlacesTargetRef = useRef<"origin" | "destination" | null>(null);

  const [pickingField, setPickingField] = useState<
    "origin" | "destination" | null
  >(null);
  const [activeInput, setActiveInput] = useState<
    "origin" | "destination" | null
  >(null);

  const [tempPickupLocation, setTempPickupLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [tempPickupAddress, setTempPickupAddress] = useState<string>("");
  const [isResolvingAddress, setIsResolvingAddress] = useState<boolean>(false);

  const [showSavedPlacesModal, setShowSavedPlacesModal] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [isAddingNewPlace, setIsAddingNewPlace] = useState(false);
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newPlaceAddress, setNewPlaceAddress] = useState("");
  const [newPlaceCoords, setNewPlaceCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const newPlaceAutocompleteRef =
    useRef<google.maps.places.Autocomplete | null>(null);

  const originRef = useRef<HTMLInputElement>(null);
  const destinationRef = useRef<HTMLInputElement>(null);

  const { user } = useSelector((state: RootState) => ({ user: state.user }));
  const { RideData } = useSelector((state: RootState) => ({
    RideData: state.RideData,
  }));
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

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchNearbyDrivers]);

  const handleOpenSavedPlaces = async (target: "origin" | "destination") => {
    if (!user.loggedIn) {
      toast({
        description: "Please login to view saved places",
        variant: "error",
      });
      return;
    }

    savedPlacesTargetRef.current = target;

    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }

    setActiveInput(target);
    setShowSavedPlacesModal(true);
    setIsAddingNewPlace(false);

    try {
      const response = await fetchData<SavedPlace[]>(
        UserApiEndpoints.GET_SAVED_PLACES
      );
      if (response?.data) {
        setSavedPlaces(response.data);
      }
    } catch (error) {
      setSavedPlaces([]);

      handleCustomError(error);
    }
  };

  const handleSelectSavedPlace = (place: SavedPlace) => {
    const target = savedPlacesTargetRef.current ?? activeInput;

    if (!target) {
      toast({ description: "No input selected to fill", variant: "error" });
      setShowSavedPlacesModal(false);
      return;
    }
    if (target === "origin") {
      setOrigin(place.address);
      if (originRef.current) originRef.current.value = place.address;
      setUseCurrentLocationAsPickup(false);
      setUserLocation({
        lat: place.coordinates.latitude,
        lng: place.coordinates.longitude,
      });
      setCenter({
        lat: place.coordinates.latitude,
        lng: place.coordinates.longitude,
      });
    } else {
      setDestination(place.address);
      if (destinationRef.current) destinationRef.current.value = place.address;
    }

    setShowSavedPlacesModal(false);
    setActiveInput(null);
  };

  const handleSaveNewPlace = async () => {
    if (!newPlaceName || !newPlaceAddress || !newPlaceCoords) {
      toast({ description: "Please fill all fields", variant: "error" });
      return;
    }

    try {
      const payload = {
        name: newPlaceName,
        address: newPlaceAddress,
        coordinates: {
          latitude: newPlaceCoords.lat,
          longitude: newPlaceCoords.lng,
        },
      };

      const response = await postData(
        UserApiEndpoints.ADD_SAVED_PLACE,
        payload
      );

      if (response?.status === 200 || response?.status === 201) {
        toast({ description: "Place saved successfully!", variant: "success" });
        setSavedPlaces((prev) => [
          ...prev,
          { ...payload, id: Date.now().toString() },
        ]);
        setIsAddingNewPlace(false);
        setNewPlaceName("");
        setNewPlaceAddress("");
        setNewPlaceCoords(null);
      }
    } catch (error) {
      handleCustomError(error);
    }
  };

  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (!pickingField || !e.latLng) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    setTempPickupLocation({ lat, lng });
    setIsResolvingAddress(true);

    try {
      const address = await coordinatesToAddress(lat, lng);
      setTempPickupAddress(address);
    } catch (error) {
      setTempPickupAddress("Unknown location");
      toast({ description: "Could not fetch address", variant: "error" });
    } finally {
      setIsResolvingAddress(false);
    }
  };

  const enableMapPicker = (type: "origin" | "destination") => {
    setPickingField(type);
    setActiveInput(null);
    setTempPickupLocation(null);
    setTempPickupAddress("");
    toast({
      description: `Tap on map to select ${
        type === "origin" ? "pickup" : "drop-off"
      } location`,
    });
  };

  const confirmMapSelection = () => {
    if (!tempPickupLocation || !tempPickupAddress || !pickingField) return;

    if (pickingField === "origin") {
      setOrigin(tempPickupAddress);
      if (originRef.current) originRef.current.value = tempPickupAddress;
      setUseCurrentLocationAsPickup(false);
      setUserLocation(tempPickupLocation);
    } else {
      setDestination(tempPickupAddress);
      if (destinationRef.current)
        destinationRef.current.value = tempPickupAddress;
    }

    setCenter(tempPickupLocation);

    setPickingField(null);
    setTempPickupLocation(null);
  };

  const cancelMapSelection = () => {
    setPickingField(null);
    setTempPickupLocation(null);
    setTempPickupAddress("");
  };

  const handleInputFocus = (type: "origin" | "destination") => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setActiveInput(type);
  };

  const handleInputBlur = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    blurTimeoutRef.current = window.setTimeout(() => {
      setActiveInput(null);
      blurTimeoutRef.current = null;
    }, 150);
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
        setDistanceInfo({
          distance: leg.distance?.text ?? "Unknown",
          duration: leg.duration?.text ?? "Unknown",
          distanceInKm: distInKm,
        });

        await calculateVehiclePricingAndAvailability(
          distInKm,
          leg.start_location.lat(),
          leg.start_location.lng()
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
      toast({ description: "Vehicle unavailable." });
      return;
    }
    if (!user.loggedIn) {
      toast({ description: "Please login.", variant: "error" });
      return;
    }

    if (RideData.status) {      
      toast({
        description: `You already have a ride that is ${RideData.status.toLowerCase()}. Finish or cancel it before booking a new one.`,
        variant: "error",
      });
      // return;
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
        estimatedPrice: selectedVehicleData.price,
        estimatedDuration: distanceInfo.duration,
        distanceInfo: {
          distance: distanceInfo.distance,
          distanceInKm: distanceInfo.distanceInKm,
        },
      };

      const response = await postData<ResponseCom["data"]>(
        ApiEndpoints.BOOK_MY_CAB,
        bookingPayload
      );
      
      if (response?.status === 201 || response?.status === 200) {
        toast({ description: "Ride request sent!", variant: "success" });
        dispatch(rideCreate(response.data));
        setShowVehicleSheet(false);
        handleClear();
      }
    } catch (e) {
      handleCustomError(e);
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
    setPickingField(null);
    setTempPickupLocation(null);
    if (originRef.current) originRef.current.value = "";
    if (destinationRef.current) destinationRef.current.value = "";
    if (userLocation) fetchNearbyDrivers(userLocation.lat, userLocation.lng);
  };

  if (!isLoaded)
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-800 text-white pb-20 sm:pb-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span>loading map</span>
          <LoaderIcon />
        </div>
      </div>
    );

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
              draggableCursor: pickingField ? "crosshair" : "default",
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

            {directions && <DirectionsRenderer directions={directions} />}

            {!pickingField &&
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

          {/* --- SEARCH OVERLAY (Hidden during map picking) --- */}
          {!pickingField && (
            <div className="absolute top-4 left-4 right-4 bg-gray-900/95 backdrop-blur-md rounded-xl shadow-lg p-4 md:w-96 border border-gray-700 z-10">
              <div className="space-y-4">
                {/* Switch for Current Location */}
                <div className="flex items-center gap-2">
                  <Switch
                    checked={useCurrentLocationAsPickup}
                    onCheckedChange={handleCurrentLocationCheck}
                  />
                  <Label className="text-gray-300 text-xs">
                    Current Location as pickup
                  </Label>
                </div>

                {/* --- PICKUP INPUT --- */}
                <div className="relative group">
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
                      onChange={(e) => {
                        setOrigin(e.target.value);
                        setUseCurrentLocationAsPickup(false);
                      }}
                      onFocus={() => handleInputFocus("origin")}
                      onBlur={handleInputBlur}
                    />
                  </Autocomplete>

                  {/* Dropdown for Pickup */}
                  {activeInput === "origin" && (
                    <>
                      <div className=" absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-50 overflow-hidden">
                        <Button
                          className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2 transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            enableMapPicker("origin");
                          }}
                        >
                          <MapPin className="h-4 w-4 text-blue-400" />
                          Set pickup location on map
                        </Button>

                        <Button
                          className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2 transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleOpenSavedPlaces("origin");
                          }}
                        >
                          <Star className="h-4 w-4 text-yellow-400" />
                          Saved Places
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                {/* --- DESTINATION INPUT --- */}
                <div className="relative group">
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
                      value={destination}
                      placeholder="Destination"
                      className="bg-gray-800 text-white"
                      onChange={(e) => setDestination(e.target.value)}
                      onBlur={handleInputBlur}
                      onFocus={() => handleInputFocus("destination")}
                    />
                  </Autocomplete>

                  {/* Dropdown for Destination */}
                  {activeInput === "destination" && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-50 overflow-hidden">
                      <Button
                        className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2 transition-colors"
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevent blur
                          enableMapPicker("destination");
                        }}
                      >
                        <Navigation className="h-4 w-4 text-red-400" />
                        Set destination on map
                      </Button>
                      <Button
                        className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2 transition-colors"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleOpenSavedPlaces("destination");
                        }}
                      >
                        <Star className="h-4 w-4 text-yellow-400" />
                        Saved Places
                      </Button>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
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

          {/* --- CONFIRMATION CARD (Visible during Map Picking) --- */}
          {pickingField && (
            <div className="absolute bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[400px] z-20">
              <Card className="bg-gray-900 border-gray-700 text-white shadow-2xl">
                <CardContent className="p-4 space-y-4">
                  <div className="text-center">
                    <h3 className="font-semibold text-lg text-blue-400">
                      {pickingField === "origin"
                        ? "Choose Pickup Spot"
                        : "Choose Drop-off Spot"}
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
                      Confirm Location
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

        {/* --- Vehicle Sheet --- */}
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
                          {v.isAvailable
                            ? v.eta
                            : "No drivers available nearby"}
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

        {/* --- SAVED PLACES MODAL / DIALOG --- */}
        {showSavedPlacesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
              {/* Header */}
              <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">
                  {isAddingNewPlace ? "Add New Place" : "Saved Places"}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowSavedPlacesModal(false);
                    savedPlacesTargetRef.current = null;
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-4 flex-1 overflow-y-auto">
                {!isAddingNewPlace ? (
                  // --- LIST VIEW ---
                  <div className="space-y-2">
                    {savedPlaces.length > 0 ? (
                      savedPlaces.map((place, idx) => (
                        <div
                          key={place.id || idx}
                          onClick={() => handleSelectSavedPlace(place)}
                          className="flex items-center gap-3 p-3 rounded-lg bg-gray-800 hover:bg-gray-700 cursor-pointer transition-colors group"
                        >
                          <div className="h-10 w-10 rounded-full bg-blue-900/50 flex items-center justify-center">
                            <Star className="h-5 w-5 text-blue-400 group-hover:fill-blue-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-white">
                              {place.name}
                            </h4>
                            <p className="text-xs text-gray-400 line-clamp-1">
                              {place.address}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No saved places found.</p>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      className="w-full mt-4 border-dashed border-gray-600 text-black-300 hover:text-white hover:bg-gray-800"
                      onClick={() => setIsAddingNewPlace(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add New Place
                    </Button>
                  </div>
                ) : (
                  // --- ADD NEW VIEW ---
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">
                        Name (e.g. Home, Gym)
                      </Label>
                      <Input
                        placeholder="Enter name"
                        value={newPlaceName}
                        onChange={(e) => setNewPlaceName(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Search Location</Label>
                      <Autocomplete
                        onLoad={(autocomplete) => {
                          newPlaceAutocompleteRef.current = autocomplete;
                          autocomplete.addListener("place_changed", () => {
                            const place = autocomplete.getPlace();
                            if (
                              place.geometry?.location &&
                              place.formatted_address
                            ) {
                              setNewPlaceAddress(place.formatted_address);
                              setNewPlaceCoords({
                                lat: place.geometry.location.lat(),
                                lng: place.geometry.location.lng(),
                              });
                            }
                          });
                        }}
                      >
                        <Input
                          placeholder="Search address..."
                          className="bg-gray-800 border-gray-700 text-white"
                          // Note: Value management for Autocomplete input is often handled by the library ref
                        />
                      </Autocomplete>
                      {newPlaceAddress && (
                        <p className="text-xs text-green-400">
                          Selected: {newPlaceAddress}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={handleSaveNewPlace}
                      >
                        <Save className="h-4 w-4 mr-2" /> Save
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
                        onClick={() => setIsAddingNewPlace(false)}
                      >
                        Back
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default RideBooking;
