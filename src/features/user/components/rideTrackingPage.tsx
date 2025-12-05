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
  Image as ImageIcon,
  MapPin,
  Clock,
  User as UserIcon,
  Car,
  Navigation,
  CheckCircle,
  Loader,
} from "lucide-react";
import { RootState } from "@/shared/services/redux/store";

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

const UserRideTracking: React.FC = () => {
  const navigate = useNavigate();
  const { rideId } = useParams();
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_API_KEY,
    libraries,
  });

  const rideDetails = useSelector(
    (state: RootState) => state.RideData.rideDetails
  );
  const status = useSelector((state: RootState) => state.RideData.status);
  const driverLocation = useSelector(
    (state: RootState) => state.RideData.latest[rideId || ""]
  );
  console.log("rideDetails", rideDetails);

  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [center, setCenter] = useState({ lat: 0, lng: 0 });
  const [zoom, setZoom] = useState(9);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<
    Array<{
      text: string;
      sender: "user" | "driver";
      image?: string;
      time: string;
    }>
  >([]);
  const [messageInput, setMessageInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!status) {
      navigate("/");
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
      status === "Accepted"
        ? { lat: driverLocation.lat, lng: driverLocation.lng }
        : status === "InRide"
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

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      setMessages([
        ...messages,
        {
          text: messageInput,
          sender: "user",
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
            sender: "user",
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
    if (rideDetails.driver?.driverNumber) {
      window.location.href = `tel:${rideDetails.driver.driverNumber}`;
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-black">
        <Loader className="animate-spin text-yellow-500" size={48} />
      </div>
    );
  }

  if (status === "Pending") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-black p-6">
        <div className="bg-black/50 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full border border-yellow-500/30 shadow-2xl">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 animate-ping bg-yellow-500/30 rounded-full"></div>
              <Car className="text-yellow-500 relative" size={64} />
            </div>
            <h2 className="text-2xl font-bold text-white text-center">
              Finding Your Driver
            </h2>
            <p className="text-gray-400 text-center">
              We're connecting you with the nearest driver. This usually takes
              less than a minute.
            </p>
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce"></div>
              <div
                className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
            <div className="w-full bg-gray-800 rounded-lg p-4 mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Pickup</span>
                <MapPin className="text-yellow-500" size={16} />
              </div>
              <p className="text-white text-sm">
                {rideDetails.pickupCoordinates?.address}
              </p>
              <div className="flex items-center justify-between mt-4 mb-2">
                <span className="text-gray-400 text-sm">Destination</span>
                <MapPin className="text-yellow-500" size={16} />
              </div>
              <p className="text-white text-sm">
                {rideDetails.dropOffCoordinates?.address}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "Completed") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-black p-6">
        <div className="bg-black/50 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full border border-green-500/30 shadow-2xl">
          <div className="flex flex-col items-center space-y-6">
            <div className="bg-green-500/20 rounded-full p-6">
              <CheckCircle className="text-green-500" size={64} />
            </div>
            <h2 className="text-2xl font-bold text-white text-center">
              Ride Completed!
            </h2>
            <p className="text-gray-400 text-center">
              Thank you for riding with us. We hope you had a great experience!
            </p>
            <div className="w-full bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Distance</span>
                <span className="text-white font-semibold">
                  {rideDetails.distanceInfo?.distance}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Duration</span>
                <span className="text-white font-semibold">
                  {rideDetails.duration}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Fare</span>
                <span className="text-yellow-500 font-bold text-lg">
                  ₹{rideDetails.price}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate("/")}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3 rounded-full transition-all duration-300 shadow-lg"
            >
              Book Another Ride
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-gray-900">
      {/* Map Container */}
      <GoogleMap
        center={center}
        zoom={zoom}
        mapContainerStyle={mapContainerStyle}
        options={mapOptions}
      >
        {driverLocation && (
          <Marker
            position={{ lat: driverLocation.lat, lng: driverLocation.lng }}
            icon={{
              url: "/images/taxi.png",
              scaledSize: new google.maps.Size(45, 45),
            }}
          />
        )}
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
        )}{" "}
      </GoogleMap>

      {/* Driver Info Card */}
      {(status === "Accepted" || status === "InRide") && rideDetails.driver && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4">
          <div className="bg-black/90 backdrop-blur-lg rounded-2xl p-4 shadow-2xl border border-yellow-500/30">
            <div className="flex items-center space-x-4">
              <img
                src={
                  rideDetails.driver.driverProfile ||
                  "/images/default-avatar.png"
                }
                alt="Driver"
                className="w-16 h-16 rounded-full border-2 border-yellow-500"
              />
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg">
                  {rideDetails.driver.driverName}
                </h3>
                <p className="text-gray-400 text-sm">
                  {rideDetails.vehicleModel}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <Navigation className="text-yellow-500" size={14} />
                  <span className="text-yellow-500 text-xs font-semibold">
                    On the way
                  </span>
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={handleCall}
                  className="bg-green-500 hover:bg-green-600 p-2 rounded-full transition-colors"
                >
                  <Phone className="text-white" size={20} />
                </button>
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="bg-blue-500 hover:bg-blue-600 p-2 rounded-full transition-colors"
                >
                  <MessageCircle className="text-white" size={20} />
                </button>
              </div>
            </div>

            {/* PIN Display for Accepted Status */}
            {status === "Accepted" && (
              <div className="mt-4 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 rounded-xl p-4 border border-yellow-500/50">
                <p className="text-gray-300 text-xs text-center mb-2">
                  Share this PIN with driver
                </p>
                <div className="flex justify-center space-x-2">
                  {rideDetails.pin
                    .toString()
                    .split("")
                    .map((digit, idx) => (
                      <div
                        key={idx}
                        className="w-10 h-12 bg-black/50 rounded-lg flex items-center justify-center border border-yellow-500"
                      >
                        <span className="text-yellow-500 font-bold text-2xl">
                          {digit}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trip Info Bottom Card */}
      {(status === "Accepted" || status === "InRide") && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4">
          <div className="bg-black/90 backdrop-blur-lg rounded-2xl p-4 shadow-2xl border border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MapPin className="text-yellow-500" size={20} />
                <div>
                  <p className="text-gray-400 text-xs">
                    {status === "Accepted" ? "Pickup Location" : "Destination"}
                  </p>
                  <p className="text-white text-sm font-semibold truncate max-w-[200px]">
                    {status === "Accepted"
                      ? rideDetails.pickupCoordinates?.address
                      : rideDetails.dropOffCoordinates?.address}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs">ETA</p>
                <p className="text-yellow-500 font-bold">
                  {rideDetails.duration}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Panel */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center sm:justify-center">
          <div className="bg-gray-900 w-full sm:max-w-md sm:rounded-2xl h-[80vh] sm:h-[600px] flex flex-col border border-yellow-500/30 shadow-2xl">
            {/* Chat Header */}
            <div className="bg-black/50 p-4 flex items-center justify-between border-b border-yellow-500/30">
              <div className="flex items-center space-x-3">
                <img
                  src={
                    rideDetails.driver?.driverProfile ||
                    "/images/default-avatar.png"
                  }
                  alt="Driver"
                  className="w-10 h-10 rounded-full border-2 border-yellow-500"
                />
                <div>
                  <h3 className="text-white font-semibold">
                    {rideDetails.driver?.driverName}
                  </h3>
                  <p className="text-gray-400 text-xs">Online</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl p-3 ${
                      msg.sender === "user"
                        ? "bg-yellow-500 text-black"
                        : "bg-gray-800 text-white"
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
                        msg.sender === "user"
                          ? "text-black/70"
                          : "text-gray-400"
                      }`}
                    >
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="bg-black/50 p-4 border-t border-yellow-500/30">
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
                  className="bg-gray-800 hover:bg-gray-700 p-2 rounded-full transition-colors"
                >
                  <ImageIcon className="text-yellow-500" size={20} />
                </button>
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-800 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-yellow-500 hover:bg-yellow-600 p-2 rounded-full transition-colors"
                >
                  <Send className="text-black" size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRideTracking;
