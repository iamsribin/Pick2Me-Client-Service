import React, { useEffect, useRef, useState } from "react";
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
import { Badge } from "@/shared/components/ui/badge";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/shared/services/redux/store";
import { toast } from "sonner";
import { BackendVehicle, VehicleOption } from "./type";
import { geocodeLatLng } from "@/shared/utils/locationToAddress";
// import { NotificationState, ResponseCom } from "@/shared/types/common";
// import { useNotification } from "@/shared/hooks/useNotificatiom";
// import { useLoading } from "@/shared/hooks/useLoading";
// import { RideStatusData } from "@/shared/types/user/rideTypes";
import { StatusCode } from "@/shared/types/enum";
import { fetchData, postData } from "@/shared/services/api/api-service";
import ApiEndpoints from "@/constants/user-api-end-pointes";
import { CommonApiEndPoint } from "@/constants/common-api-ent-point";
import { ResponseCom } from "@/shared/types/common";

const libraries: "places"[] = ["places"];
const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const mapOptions: google.maps.MapOptions = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

const RideBooking: React.FC = () => {
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: 13.003371,
    lng: 77.589134,
  });
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [zoom, setZoom] = useState<number>(13);
  const [origin, setOrigin] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [rideStatus, setRideStatus] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  // const { showLoading, hideLoading } = useLoading();
  const [distanceInfo, setDistanceInfo] = useState<{
    distance: string;
    duration: string;
    distanceInKm: number;
  } | null>(null);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [useCurrentLocationAsPickup, setUseCurrentLocationAsPickup] =
    useState<boolean>(false);
  const [showVehicleSheet, setShowVehicleSheet] = useState<boolean>(false);
  const [driverDirections, setDriverDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [notification, setNotification] = useState<any>({
    open: false,
    type: "info",
    title: "",
    message: "",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const originRef = useRef<HTMLInputElement>(null);
  const destinationRef = useRef<HTMLInputElement>(null);
  // const { socket, isConnected } = useSocket();
  const { user } = useSelector((state: RootState) => ({
    user: state.user,
  }));
    // const { paymentStatus, rideData } = useSelector(
    //   (state: RootState) => state.RideMap
    // );

  // const { onNotification, offNotification } = useNotification();

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_API_KEY,
    libraries,
  });

  useEffect(() => {
    const getUserLocation = () => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setCenter({ lat: latitude, lng: longitude });

          if (useCurrentLocationAsPickup) {
            setOrigin("Current Location");
            if (originRef.current) originRef.current.value = "Current Location";
          }
        },
        (error) => {
          // onNotification("error", "Unable to get your current location");
        }
      );
    };

    getUserLocation();

    return () => {
      // if (socket && isConnected) {
      //   socket.off("rideStatus");
      //   socket.off("error");
      // }
    };
  }, [
    // socket,
    // isConnected,
    dispatch,
    navigate,
    useCurrentLocationAsPickup,
    userLocation,
  ]);

  useEffect(() => {
    if (useCurrentLocationAsPickup && userLocation) {
      setOrigin("Current Location");
      if (originRef.current) originRef.current.value = "Current Location";
    } else if (!useCurrentLocationAsPickup && origin === "Current Location") {
      setOrigin("");
      if (originRef.current) originRef.current.value = "";
    }
  }, [useCurrentLocationAsPickup, userLocation]);

  const fetchVehicles = async (distanceInKm: number) => {
    try {
      const data = await fetchData<BackendVehicle[]>(
        CommonApiEndPoint.VEHICLE_MODELS,
      );

      const fetchedVehicles: any[] = data?.data.map((vehicle) => ({
        id: vehicle.vehicleModel.toLowerCase(),
        name: vehicle.vehicleModel,
        image: vehicle.image,
        price: Math.ceil(vehicle.basePrice + vehicle.pricePerKm * distanceInKm),
        pricePerKm: vehicle.pricePerKm,
        eta: vehicle.eta,
        features: vehicle.features,
      }));

      setVehicles(fetchedVehicles);
      setShowVehicleSheet(true);
    } catch (error) {
      setNotification({
        open: true,
        type: "error",
        title: "Vehicle Data Error",
        message: "Could not fetch vehicle options. Please try again.",
      });
    }
  };

  const fetchRoute = async () => {
    if (!origin || !destination || !userLocation) {
      // onNotification(
      //   "error",
      //   "Please enter valid pickup and dropoff locations"
      // );
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    const originLocation =
      useCurrentLocationAsPickup && userLocation
        ? new google.maps.LatLng(userLocation.lat, userLocation.lng)
        : origin;

    try {
      const result = await directionsService.route({
        origin: originLocation,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      });

      setDirections(result);
      const route = result.routes[0];
      if (route?.legs[0]) {
        const distanceInMeters = route.legs[0].distance?.value ?? 0;
        setDistanceInfo({
          distance: route.legs[0].distance?.text ?? "Unknown",
          duration: route.legs[0].duration?.text ?? "Unknown",
          distanceInKm: distanceInMeters / 1000,
        });
        await fetchVehicles(distanceInMeters / 1000);
      }
    } catch (error) {
      console.log("Route Error==", error);

      setNotification({
        open: true,
        type: "error",
        title: "Route Error",
        message: "Could not calculate the route",
      });
    }
  };

  const handleSearchCabs = async () => {
    // if(rideData){
    //  onNotification("alert", "You're already on a ride. Finish it before booking another.");
    //   return;
    // }
    if (
      !destination ||
      (useCurrentLocationAsPickup && !userLocation) ||
      (!useCurrentLocationAsPickup && !origin)
    ) {
      // onNotification("error", "Please enter required location details");
      return;
    }
    await fetchRoute();
  };

  const handleBookRide = async () => {
    if (
      !origin ||
      !destination ||
      !userLocation ||
      !selectedVehicle ||
      !distanceInfo
    ) {
      toast.error("Please select a vehicle and ensure all locations are set");
      return;
    }
    setIsSearching(true);

    try {
      // if (!socket || !isConnected) {
      //   throw new Error("Socket not connected");
      // }
      // showLoading({
      //   isLoading: true,
      //   loadingMessage: "Searching nearby Drivers",
      //   loadingType: "ride-search",
      //   progress: 30,
      // });

      const pickupLat =
        directions?.routes[0]?.legs[0]?.start_location?.lat() ??
        userLocation.lat;
      const pickupLng =
        directions?.routes[0]?.legs[0]?.start_location?.lng() ??
        userLocation.lng;
      const dropoffLat =
        directions?.routes[0]?.legs[0]?.end_location?.lat() ??
        userLocation.lat + 0.05;
      const dropoffLng =
        directions?.routes[0]?.legs[0]?.end_location?.lng() ??
        userLocation.lng + 0.05;

      let pickupAddress = origin;
      let dropoffAddress = destination;

      try {
        pickupAddress = await geocodeLatLng(pickupLat, pickupLng);
        dropoffAddress = await geocodeLatLng(dropoffLat, dropoffLng);
      } catch (error) {
        console.error("Failed to geocode location:", error);
      }

      const selectedVehicleData = vehicles.find(
        (v) => v.id === selectedVehicle
      );
      const vehicleModel = selectedVehicleData?.name ?? "Standard";

      const bookingData = {
        pickupLocation: {
          address: pickupAddress,
          latitude: pickupLat,
          longitude: pickupLng,
        },
        dropOffLocation: {
          address: dropoffAddress,
          latitude: dropoffLat,
          longitude: dropoffLng,
        },
        vehicleModel,
        userName: user.user,
        estimatedPrice: selectedVehicleData?.price ?? 0,
        estimatedDuration: distanceInfo.duration,
        distanceInfo: {
          distance: distanceInfo.distance,
          distanceInKm: distanceInfo.distanceInKm,
        },
        mobile: user.mobile,
        profile: user.profile,
      };

      const data = await postData<ResponseCom["data"]>(
        ApiEndpoints.BOOK_MY_CAB,
        bookingData
      );

      console.log("sta==", data);
      
      setIsSearching(false);
      setShowVehicleSheet(false);
      if (data.status == StatusCode.Created) {
        // showLoading({
        //   isLoading: true,
        //   loadingMessage: "Searching nearby Drivers",
        //   loadingType: "ride-search",
        //   progress: 60,
        // });
      }
    } catch (error) {
      console.log("booking error", error);
      toast.error("Failed to send ride request. Please try again.");
      setNotification({
        open: true,
        type: "error",
        title: "Booking Error",
        message: "Failed to send ride request. Please try again.",
      });
      // hideLoading();
      setIsSearching(false);
      handleClear();
    }
  };

  const handleClear = () => {
    setOrigin("");
    setDestination("");
    setRideStatus(null);
    setIsSearching(false);
    setDirections(null);
    setDriverDirections(null);
    setDistanceInfo(null);
    setVehicles([]);
    setSelectedVehicle(null);
    setShowVehicleSheet(false);
    if (originRef.current) originRef.current.value = "";
    if (destinationRef.current) destinationRef.current.value = "";
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="text-white">Loading Map...</div>
      </div>
    );
  }

  return (
        <section className="py-20 bg-gradient-to-br from-black to-gray-800">

    <div className="container mx-auto px-4 py-8 bg-gray-900">
      <header className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-white">Find Your Ride</h1>
        <p className="text-gray-400 mt-2">
          Safe, reliable rides to your destination
        </p>
      </header>

      <div className="relative">
        <div className="h-[75vh] w-full rounded-xl overflow-hidden shadow-xl">
          <GoogleMap
            center={center}
            zoom={zoom}
            mapContainerStyle={mapContainerStyle}
            options={mapOptions}
            onLoad={(mapInstance) => setMap(mapInstance)}
          >
            {userLocation && !directions && !driverDirections && (
              <Marker position={userLocation} />
            )}
            {driverDirections ? (
              <DirectionsRenderer directions={driverDirections} />
            ) : directions ? (
              <DirectionsRenderer directions={directions} />
            ) : null}
            {rideStatus?.driverCoordinates && (
              <Marker
                position={{
                  lat: rideStatus.driverCoordinates.latitude,
                  lng: rideStatus.driverCoordinates.longitude,
                }}
                label="Driver"
              />
            )}
          </GoogleMap>
        </div>

        <div className="absolute top-4 left-4 right-4 bg-gray-900/95 backdrop-blur-md rounded-xl shadow-lg p-4 md:w-96 md:left-4 md:right-auto border border-gray-700">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch
                id="use-current-location"
                checked={useCurrentLocationAsPickup}
                onCheckedChange={setUseCurrentLocationAsPickup}
              />
              <Label
                htmlFor="use-current-location"
                className="text-sm font-medium text-gray-300"
              >
                Use my current location as pickup
              </Label>
            </div>

            {!useCurrentLocationAsPickup && (
              <div className="w-full">
                <label className="text-sm font-medium text-gray-300 mb-1 block">
                  Pickup Location
                </label>
                <div className="flex gap-2">
                  <Autocomplete className="w-full">
                    <Input
                      type="text"
                      ref={originRef}
                      placeholder="Enter pickup location"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white focus:border-gray-500"
                    />
                  </Autocomplete>
                  <Button
                    size="icon"
                    className="bg-gray-700 hover:bg-gray-600 text-white"
                    onClick={() => {
                      if (userLocation) {
                        setOrigin("Current Location");
                        if (originRef.current)
                          originRef.current.value = "Current Location";
                      }
                    }}
                  >
                    <GpsFixedIcon className="text-white h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            <div className="w-full">
              <label className="text-sm font-medium text-gray-300 mb-1 block">
                Dropoff Location
              </label>
              <Autocomplete className="w-full">
                <Input
                  type="text"
                  ref={destinationRef}
                  placeholder="Enter destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white focus:border-gray-500"
                />
              </Autocomplete>
            </div>

            <div className="flex gap-2">
              <Button
                className="w-3/4 h-10 bg-gray-700 hover:bg-gray-600 font-medium text-white"
                onClick={handleSearchCabs}
                disabled={
                  (useCurrentLocationAsPickup &&
                    (!userLocation || !destination)) ||
                  (!useCurrentLocationAsPickup && (!origin || !destination)) ||
                  isSearching
                }
              >
                <DirectionsCarIcon className="mr-2 h-5 w-5" />
                Find Rides
              </Button>
              <Button
                className="w-1/4 h-10 bg-gray-600 text-gray-300 hover:bg-gray-500 font-medium"
                onClick={handleClear}
                disabled={isSearching}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>

        <Sheet open={showVehicleSheet} onOpenChange={setShowVehicleSheet}>
          <SheetContent
            side="bottom"
            className="h-[70vh] rounded-t-xl max-w-2xl mx-auto bg-gray-900 border-gray-700"
          >
            <SheetHeader className="text-left mb-4">
              <SheetTitle className="text-2xl text-white">Choose Your Ride</SheetTitle>
              {distanceInfo && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-4 text-sm">
                    <Badge
                      variant="outline"
                      className="bg-gray-800 text-gray-300 border-gray-600"
                    >
                      Distance: {distanceInfo.distance}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-gray-800 text-gray-300 border-gray-600"
                    >
                      Duration: {distanceInfo.duration}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    * Prices are estimates and may vary based on route, traffic,
                    and weather conditions.
                  </p>
                </div>
              )}
            </SheetHeader>

            <div className="grid gap-4 pb-16">
              {vehicles.map((vehicle) => (
                <Card
                  key={vehicle.id}
                  className={`cursor-pointer transition-all bg-gray-800 border-gray-700 ${
                    selectedVehicle === vehicle.id
                      ? "border-gray-500 shadow-md"
                      : "hover:border-gray-600"
                  }`}
                  onClick={() => setSelectedVehicle(vehicle.id)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
                        <img
                          src={vehicle.image}
                          alt={vehicle.name}
                          className="w-14 h-14 object-contain"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-lg text-white">{vehicle.name}</p>
                        <p className="text-sm text-gray-400">{vehicle.eta}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {vehicle.features.map((feature, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs bg-gray-700 text-gray-300"
                            >
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-white">${vehicle.price}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-gray-900 p-4 border-t border-gray-700 max-w-2xl mx-auto">
              <Button
                className="w-full h-14 text-lg font-medium bg-gray-700 hover:bg-gray-600 text-white"
                onClick={handleBookRide}
                disabled={!selectedVehicle || isSearching}
              >
                {isSearching ? (
                  <div className="flex items-center gap-2">
                    <span>Finding Driver</span>
                    <Player
                      autoplay
                      loop
                      src="https://lottie.host/6d218af1-a90d-49b2-b56e-7ba126e3ac68/mNvXamDXCm.json"
                      style={{ height: "30px", width: "30px" }}
                    />
                  </div>
                ) : (
                  `Book ${
                    selectedVehicle
                      ? vehicles.find((v) => v.id === selectedVehicle)?.name ??
                        "Ride"
                      : "Ride"
                  }`
                )}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
    </section>
  );
};

export default RideBooking;