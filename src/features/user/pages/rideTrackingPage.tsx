import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";
import { Loader } from "lucide-react";
import { RootState } from "@/shared/services/redux/store";
import { libraries } from "@/constants/map-options";
import useWebRTC from "@/shared/hooks/useWebRTC";
import useChat from "@/shared/hooks/useChat";
import useDirections from "@/shared/hooks/useDirections";
import { PendingScreen } from "../components/ride/PendingScreen";
import { CompletedScreen } from "../components/ride/CompletedScreen";
import { UserRideDetailsCard } from "../components/ride/UserRideDetailsCard";
import { ChatModal } from "../components/ride/ChatModal";
import { CallModals } from "../components/ride/CallModals";

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

  const {
    isCalling,
    incomingCall,
    callActive,
    isMuted,
    handleCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
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
  const [showCarImages, setShowCarImages] = useState(false);

  // Ringtone audio ref for incoming calls
  const callRingtoneRef = useRef<HTMLAudioElement>(null);

  // Play ringtone on incoming call
  useEffect(() => {
    if (incomingCall && callRingtoneRef.current) {
      callRingtoneRef.current.src = "/uber_tune.mp3";
      callRingtoneRef.current.loop = true;
      callRingtoneRef.current.volume = 0.5; // Adjust volume as needed
      callRingtoneRef.current.play().catch((error) => {
        console.warn("Could not play call ringtone:", error);
      });
    }
  }, [incomingCall]);

  // Stop ringtone when call is accepted, rejected, or ended
  useEffect(() => {
    if (!incomingCall && callRingtoneRef.current) {
      callRingtoneRef.current.pause();
      callRingtoneRef.current.currentTime = 0;
    }
  }, [incomingCall, callActive]);

  useEffect(() => {
    if (!status) {
      navigate("/");
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
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-black">
        <Loader className="animate-spin text-yellow-500" size={48} />
      </div>
    );
  }

  if (status === "Pending") {
    return <PendingScreen rideDetails={rideDetails} />;
  }

  if (status === "Completed") {
    return (
      <CompletedScreen
        rideDetails={rideDetails}
        onBookAnother={() => navigate("/")}
      />
    );
  }

  return (
    <div className="relative h-screen w-full bg-gray-900">
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
        )}
      </GoogleMap>

      {(status === "Accepted" || status === "InRide") && rideDetails.driver && (
        <UserRideDetailsCard
          status={status}
          rideDetails={rideDetails}
          showDetails={showDetails}
          setShowDetails={setShowDetails}
          showCarImages={showCarImages}
          setShowCarImages={setShowCarImages}
          onCall={handleCall}
          unreadCount={chat.unreadCount}
          onOpenChat={chat.openChat}
        />
      )}

      {/* Chat Modal */}
      <ChatModal
        isOpen={chat.isChatOpen}
        onClose={() => chat.setIsChatOpen(false)}
        messages={chat.messages}
        messageInput={chat.messageInput}
        driverIsTyping={chat.remoteUserIsTyping}
        rideDetails={rideDetails}
        onTypingChange={chat.handleTypingChange}
        onSendMessage={chat.handleSendMessage}
        onImageUpload={chat.handleImageUpload}
        onEdit={chat.handleEditMessage}
        onDelete={chat.handleDeleteMessage}
        chatEndRef={chat.chatEndRef}
      />
    </div>
  );
};

export default UserRideTracking;
