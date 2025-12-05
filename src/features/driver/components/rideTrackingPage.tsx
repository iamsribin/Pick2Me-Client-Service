import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";
import {
  Phone,
  MessageCircle,
  X,
  Send,
  ImagePlus,
  MapPin,
  User,
  CheckCircle,
  Loader,
  AlertCircle,
  Clock,
} from "lucide-react";
import { RootState } from "@/shared/services/redux/store";
import { useAnimatedDriverMarker } from "@/shared/hooks/useAnimatedDriverMarker";

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
};

const DriverRideTracking: React.FC = () => {
  const navigate = useNavigate();
  const { rideId } = useParams();
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_API_KEY,
    libraries,
  });

  const displayPos = useAnimatedDriverMarker(rideId);

  const rideDetails = useSelector(
    (state: RootState) => state.RideData.rideDetails
  );
  const status = useSelector((state: RootState) => state.RideData.status);
  const driverLocation = useSelector(
    (state: RootState) => state.RideData.latest[rideId || ""]
  );

  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [center, setCenter] = useState({ lat: 0, lng: 0 });
  const [zoom, setZoom] = useState(9);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<
    Array<{
      text: string;
      sender: "driver" | "user";
      image?: string;
      time: string;
    }>
  >([]);
  const [messageInput, setMessageInput] = useState("");
  const [pinInput, setPinInput] = useState(["", "", "", "", "", ""]);
  const [pinError, setPinError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!status) {
      navigate("/driver/dashboard");
    }
  }, [status, navigate]);

  useEffect(() => {
    if (status === "Accepted" || status === "InRide") {
      if (rideDetails.pickupCoordinates) {
        setCenter({
          lat: rideDetails.pickupCoordinates.latitude,
          lng: rideDetails.pickupCoordinates.longitude,
        });
      }
    }
  }, [rideDetails, status]);

  useEffect(() => {
    if (!isLoaded || !driverLocation) return;

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

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (value && !/^\d+$/.test(value)) return;

    const newPin = [...pinInput];
    newPin[index] = value;
    setPinInput(newPin);
    setPinError("");

    if (value && index < 5) {
      pinInputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pinInput[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmitPin = () => {
    const enteredPin = pinInput.join("");
    if (enteredPin.length !== 6) {
      setPinError("Please enter all 6 digits");
      return;
    }
    if (enteredPin !== rideDetails.pin.toString()) {
      setPinError("Invalid PIN. Please try again.");
      return;
    }
    // PIN verified - Here you would dispatch an action to start the ride
    console.log("PIN verified, starting ride...");
  };

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      setMessages([
        ...messages,
        {
          text: messageInput,
          sender: "driver",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
      setMessageInput("");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMessages([
          ...messages,
          {
            text: "",
            sender: "driver",
            image: reader.result as string,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCall = () => {
    if (rideDetails.user?.userNumber) {
      window.location.href = `tel:${rideDetails.user.userNumber}`;
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-yellow-50 to-yellow-100">
        <Loader className="animate-spin text-yellow-600" size={48} />
      </div>
    );
  }

  if (status === "Completed") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 p-6">
        <div className="bg-white backdrop-blur-lg rounded-3xl p-8 max-w-md w-full border-2 border-yellow-500 shadow-2xl">
          <div className="flex flex-col items-center space-y-6">
            <div className="bg-green-100 rounded-full p-6 border-2 border-green-500">
              <CheckCircle className="text-green-600" size={64} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              Ride Completed Successfully!
            </h2>
            <p className="text-gray-700 text-center">
              Great job! Your earnings have been added to your wallet.
            </p>
            <div className="w-full bg-yellow-50 rounded-lg p-4 space-y-3 border border-yellow-300">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Distance</span>
                <span className="text-gray-900 font-semibold">
                  {rideDetails.distanceInfo?.distance}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Duration</span>
                <span className="text-gray-900 font-semibold">
                  {rideDetails.duration}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Earnings</span>
                <span className="text-yellow-600 font-bold text-lg">
                  ₹{rideDetails.price}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate("/driver/dashboard")}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold py-3 rounded-full transition-all duration-300 shadow-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-yellow-50">
      <GoogleMap
        center={center}
        zoom={zoom}
        mapContainerStyle={mapContainerStyle}
        options={mapOptions}
      >
        {displayPos && (
          <Marker
            position={{ lat: displayPos.lat, lng: displayPos.lng }}
            icon={{
              url: "/images/taxi.png",
              scaledSize: new google.maps.Size(45, 45),
              // To rotate icon by heading use a canvas-based icon or marker rotation technique.
            }}
          />
        )}

        {/* Pickup */}
        {status === "Accepted" && rideDetails.pickupCoordinates && (
          <Marker
            position={{
              lat: rideDetails.pickupCoordinates.latitude,
              lng: rideDetails.pickupCoordinates.longitude,
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#22c55e",
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: "white",
            }}
          />
        )}
        {/* Drop */}
        {status === "InRide" && rideDetails.dropOffCoordinates && (
          <Marker
            position={{
              lat: rideDetails.dropOffCoordinates.latitude,
              lng: rideDetails.dropOffCoordinates.longitude,
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#ef4444",
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: "white",
            }}
          />
        )}

        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: "#2b8cff",
                strokeWeight: 6,
                clickable: false,
              },
            }}
          />
        )}
      </GoogleMap>

      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4">
        <div className="bg-white backdrop-blur-lg rounded-2xl p-4 shadow-2xl border-2 border-yellow-500">
          <div className="flex items-center space-x-4">
            <img
              src={
                rideDetails.user?.userProfile || "/images/default-avatar.png"
              }
              alt="User"
              className="w-16 h-16 rounded-full border-2 border-yellow-500"
            />
            <div className="flex-1">
              <h3 className="text-gray-900 font-bold text-lg">
                {rideDetails.user?.userName}
              </h3>
              <p className="text-gray-700 text-sm">
                {rideDetails.user?.userNumber}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <Clock className="text-yellow-600" size={14} />
                <span className="text-yellow-600 text-xs font-semibold">
                  {status === "Accepted" ? "Pickup" : "Drop-off"} -{" "}
                  {rideDetails.duration}
                </span>
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <button
                onClick={handleCall}
                className="bg-green-500 hover:bg-green-600 p-2 rounded-full transition-colors shadow-lg"
              >
                <Phone className="text-white" size={20} />
              </button>
              <button
                onClick={() => setIsChatOpen(true)}
                className="bg-blue-500 hover:bg-blue-600 p-2 rounded-full transition-colors shadow-lg"
              >
                <MessageCircle className="text-white" size={20} />
              </button>
            </div>
          </div>

          {status === "Accepted" && (
            <div className="mt-4 bg-yellow-50 rounded-xl p-4 border-2 border-yellow-500">
              <p className="text-gray-700 text-sm text-center mb-3 font-semibold">
                Enter Pickup PIN
              </p>
              <div className="flex justify-center space-x-2 mb-3">
                {pinInput.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (pinInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(idx, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(idx, e)}
                    className="w-10 h-12 bg-white rounded-lg text-center text-gray-900 font-bold text-2xl border-2 border-yellow-500 focus:border-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                  />
                ))}
              </div>
              {pinError && (
                <div className="flex items-center justify-center space-x-1 mb-2">
                  <AlertCircle className="text-red-500" size={16} />
                  <p className="text-red-500 text-xs">{pinError}</p>
                </div>
              )}
              <button
                onClick={handleSubmitPin}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold py-2 rounded-full transition-all duration-300 shadow-lg"
              >
                Start Ride
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4">
        <div className="bg-white backdrop-blur-lg rounded-2xl p-4 shadow-2xl border-2 border-yellow-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MapPin className="text-yellow-600" size={20} />
              <div>
                <p className="text-gray-600 text-xs">
                  {status === "Accepted"
                    ? "Pickup Location"
                    : "Drop-off Location"}
                </p>
                <p className="text-gray-900 text-sm font-semibold truncate max-w-[200px]">
                  {status === "Accepted"
                    ? rideDetails.pickupCoordinates?.address
                    : rideDetails.dropOffCoordinates?.address}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-600 text-xs">Fare</p>
              <p className="text-yellow-600 font-bold text-lg">
                ₹{rideDetails.price}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isChatOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center sm:justify-center">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl h-[80vh] sm:h-[600px] flex flex-col border-2 border-yellow-500 shadow-2xl">
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={
                    rideDetails.user?.userProfile ||
                    "/images/default-avatar.png"
                  }
                  alt="User"
                  className="w-10 h-10 rounded-full border-2 border-white"
                />
                <div>
                  <h3 className="text-white font-bold">
                    {rideDetails.user?.userName}
                  </h3>
                  <p className="text-white/80 text-xs">Online</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-white hover:text-white/80 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-yellow-50">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.sender === "driver" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl p-3 ${
                      msg.sender === "driver"
                        ? "bg-yellow-500 text-white"
                        : "bg-white text-gray-900 border border-gray-200"
                    }`}
                  >
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="Sent"
                        className="rounded-lg mb-2"
                      />
                    )}
                    {msg.text && <p className="text-sm">{msg.text}</p>}
                    <p
                      className={`text-xs mt-1 ${
                        msg.sender === "driver"
                          ? "text-white/70"
                          : "text-gray-500"
                      }`}
                    >
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-4 border-t-2 border-yellow-500">
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-yellow-100 hover:bg-yellow-200 p-2 rounded-full transition-colors"
                >
                  <ImagePlus className="text-yellow-600" size={20} />
                </button>
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-yellow-50 text-gray-900 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 border border-yellow-300"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-yellow-500 hover:bg-yellow-600 p-2 rounded-full transition-colors shadow-lg"
                >
                  <Send className="text-white" size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverRideTracking;
