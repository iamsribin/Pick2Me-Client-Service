import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from "@react-google-maps/api";
import { Loader } from "lucide-react";
import { RootState } from "@/shared/services/redux/store";
import { useAnimatedDriverMarker } from "@/shared/hooks/useAnimatedDriverMarker";
import { RideDetailsCard } from "../components/RideDetailsCard";
import { ChatModal } from "../components/ChatModal";
import { CallModals } from "../components/CallModals";
import { PinEntry } from "../components/PinEntry";
import useDirections from "@/shared/hooks/useDirections";
import { RideCompletionHandler } from "../components/RideCompletionHandler";
import useWebRTC from "@/shared/hooks/useWebRTC";
import useChat from "@/shared/hooks/useChat";
import { RideDetails } from "@/shared/types/common";
import { toast } from "@/shared/hooks/use-toast";
import { calculateDistance } from "@/shared/utils/getDistanceInMeters";
import { postData } from "@/shared/services/api/api-service";
import DriverApiEndpoints from "@/constants/driver-api-end-pontes";
import { handleCustomError } from "@/shared/utils/error";

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
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_API_KEY,
    libraries,
  });
  const rideDetails = useSelector(
    (state: RootState) => state.RideData.rideDetails
  );
  const rideId = rideDetails.rideId;
  const status = useSelector((state: RootState) => state.RideData.status);
  const driverLocation = useSelector(
    (state: RootState) => state.RideData.latest[rideId || ""]
  );

  const displayPos = useAnimatedDriverMarker(rideId);

const usePinHandlers = (
  pinInput: string[],
  setPinInput: React.Dispatch<React.SetStateAction<string[]>>,
  setPinError: React.Dispatch<React.SetStateAction<string>>,
  driverLocation: any,
  rideDetails: RideDetails
) => {
  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (value && !/^\d+$/.test(value)) return;

    const newPin = [...pinInput];
    newPin[index] = value;
    setPinInput(newPin);
    setPinError("");

    if (value && index < 5) {
      // Focus next input logic 
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pinInput[index] && index > 0) {
      // Focus previous
    }
  };

  const handleSubmitPin = async () => {
    try {
      const enteredPin = pinInput.join("");
      if (enteredPin.length !== 6) {
        setPinError("Please enter all 6 digits");
        return;
      }
      if (!driverLocation?.lat || !driverLocation?.lng) {
        toast({
          description: "Driver location not available",
          variant: "error",
        });
        return;
      }

      const driverDist = await calculateDistance(
        driverLocation?.lat,
        driverLocation?.lng,
        rideDetails.pickupCoordinates.latitude,
        rideDetails.pickupCoordinates.longitude
      );

      if (driverDist > 500) {
        toast({
          description:
            "You're too far from the pickup. You need to be within 500 meters.",
          variant: "error",
        });
        return;
      }

      const response = await postData(DriverApiEndpoints.CHECK_SECURITY_PIN, {
        enteredPin,
        _id: rideDetails.id,
      });
      if (response?.status == 200)
        toast({ description: "Ride started successfully", variant: "success" });
    } catch (error) {
      handleCustomError(error);
    }
  };

  return { handlePinChange, handlePinKeyDown, handleSubmitPin };
};

    const {
      isCalling,
      incomingCall,
      callActive,
      isMuted,
      handleCall,
      toggleMute,
      endCall,
      acceptCall,
      rejectCall,
      remoteAudioRef,
    } = useWebRTC(rideDetails, status);

    const chat = useChat(rideDetails, rideId);

    const { directions, center, zoom } = useDirections(
      rideDetails,
      driverLocation,
      status,
      isLoaded
    );

    const [showDetails, setShowDetails] = useState(false);
    const [pinInput, setPinInput] = useState(["", "", "", "", "", ""]);
    const [pinError, setPinError] = useState("");

    const { handlePinChange, handlePinKeyDown, handleSubmitPin } = usePinHandlers(
      pinInput,
      setPinInput,
      setPinError,
      driverLocation,
      rideDetails
    );

    const { handleCompleteRide } = RideCompletionHandler.useHandlers(
      driverLocation,
      rideDetails
    );

    const callRingtoneRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
      if (incomingCall && callRingtoneRef.current) {
        callRingtoneRef.current.src = '/uber_tune.mp3'; 
        callRingtoneRef.current.loop = true;
        callRingtoneRef.current.volume = 0.5; 
        callRingtoneRef.current.play().catch((error) => {
          console.warn('Could not play call ringtone:', error);
        });
      }
    }, [incomingCall]);

    useEffect(() => {
      if (!incomingCall && callRingtoneRef.current) {
        callRingtoneRef.current.pause();
        callRingtoneRef.current.currentTime = 0;
      }
    }, [incomingCall, callActive]);

    useEffect(() => {
      if (!status) {
        navigate("/driver/dashboard");
      }
    }, [status, navigate]);

    // useEffect(() => {
    //   if (status === "Accepted" || status === "InRide") {
    //     if (rideDetails.pickupCoordinates) {
    //       // Center update handled in useDirections
    //     }
    //   }
    // }, [rideDetails, status]);

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
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">✓</span>
                </div>
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
        {/* Audio Element for Call (Remote Audio) */}
        <audio ref={remoteAudioRef} autoPlay playsInline />
        <audio ref={chat.messageNotificationRef} autoPlay playsInline />

        {/* Call Ringtone Audio (Hidden) */}
        <audio ref={callRingtoneRef} />

        {/* Call Modals */}
        <CallModals
          incomingCall={incomingCall}
          callActive={callActive}
          isCalling={isCalling}
          isMuted={isMuted}
          rideDetails={rideDetails}
          onAcceptCall={acceptCall} 
          onRejectCall={rejectCall} 
          onToggleMute={toggleMute}
          onEndCall={endCall}
        />

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
          )}
        </GoogleMap>

        {/* Bottom Ride Details Card */}
        <RideDetailsCard
          status={status}
          rideDetails={rideDetails}
          showDetails={showDetails}
          setShowDetails={setShowDetails}
          onCall={handleCall}
          unreadCount={chat.unreadCount}
          onOpenChat={chat.openChat}
          onCompleteRide={handleCompleteRide}
          pinInput={pinInput}
          pinError={pinError}
          onPinChange={handlePinChange}
          onPinKeyDown={handlePinKeyDown}
          onSubmitPin={handleSubmitPin}
        />

        {/* Chat Modal */}
        <ChatModal
          isOpen={chat.isChatOpen}
          onClose={() => chat.setIsChatOpen(false)}
          messages={chat.messages}
          messageInput={chat.messageInput}
          userIsTyping={chat.remoteUserIsTyping}
          rideDetails={rideDetails}
          onTypingChange={chat.handleTypingChange}
          onSendMessage={chat.handleSendMessage}
          onImageUpload={chat.handleImageUpload}
          onEditMessage={chat.handleEditMessage}
          onDeleteMessage={chat.handleDeleteMessage}
          chatEndRef={chat.chatEndRef}
        />
      </div>
    );
  };

  export default DriverRideTracking;