import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
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
  CheckCircle,
  Loader,
  AlertCircle,
  Clock,
  ChevronUp,
  ChevronDown,
  PhoneOff,
  Mic,
  MicOff,
  PhoneIncoming,
} from "lucide-react";
import { RootState } from "@/shared/services/redux/store";
import { useAnimatedDriverMarker } from "@/shared/hooks/useAnimatedDriverMarker";
import { postData } from "@/shared/services/api/api-service";
import DriverApiEndpoints from "@/constants/driver-api-end-pontes";
import { toast } from "@/shared/hooks/use-toast";
import { handleCustomError } from "@/shared/utils/error";
import { calculateDistance } from "@/shared/utils/getDistanceInMeters";
import { Button } from "@/shared/components/ui/button";
import socketService from "@/shared/services/socketService";
import { emitSocket } from "@/shared/utils/emitSocket";
import {
  addMessage,
  ChatMessage,
  deleteMessage,
  editMessage,
  markChatAsRead,
} from "@/shared/services/redux/slices/rideSlice";

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

const peerConnectionConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
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

  const displayPos = useAnimatedDriverMarker(rideId);
  const dispatch = useDispatch();

  const status = useSelector((state: RootState) => state.RideData.status);
  const driverLocation = useSelector(
    (state: RootState) => state.RideData.latest[rideId || ""]
  );
  const messages = useSelector(
    (state: RootState) => state.RideData.chat[rideId || ""] ?? []
  );
  const unreadCount = useSelector(
    (state: RootState) => state.RideData.unreadCounts[rideId || ""] ?? 0
  );

  const [userIsTyping, setUserIsTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [center, setCenter] = useState({ lat: 0, lng: 0 });
  const [zoom, setZoom] = useState(9);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [pinInput, setPinInput] = useState(["", "", "", "", "", ""]);
  const [pinError, setPinError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // --- WebRTC State & Refs ---
  const [isCalling, setIsCalling] = useState(false); // Outgoing call status
  const [incomingCall, setIncomingCall] = useState<any>(null); // Incoming call object
  const [callActive, setCallActive] = useState(false); // Call connected
  const [isMuted, setIsMuted] = useState(false);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Socket & WebRTC Listeners ---
  useEffect(() => {
    const handleIncomingMessage = (data: any) => {
      const msg: ChatMessage = {
        id: data.id,
        text: data.text || "",
        image: data.image,
        sender: "user",
        time: data.time,
        edited: data.edited,
        deleted: data.deleted,
      };
      dispatch(addMessage({ rideId, message: msg }));
    };

    const handleTyping = (data: { isTyping: boolean }) => {
      setUserIsTyping(data.isTyping);
    };

    const handleEdit = (data: { messageId: string; newText: string }) => {
      dispatch(
        editMessage({
          rideId,
          messageId: data.messageId,
          newText: data.newText,
        })
      );
    };

    const handleDelete = (data: { messageId: string }) => {
      dispatch(deleteMessage({ rideId, messageId: data.messageId }));
    };

    // WebRTC: Handle Incoming Call
    const handleIncomingCall = async (data: { offer: any }) => {
      console.log("Incoming call received");
      setIncomingCall(data);
    };

    // WebRTC: Handle Call Accepted (Remote answered our offer)
    const handleCallAccepted = async (data: { answer: any }) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
        setIsCalling(false);
        setCallActive(true);
      }
    };

    // WebRTC: Handle ICE Candidates
    const handleIceCandidate = async (data: { candidate: any }) => {
      if (peerConnection.current && data.candidate) {
        try {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        } catch (e) {
          console.error("Error adding received ice candidate", e);
        }
      }
    };

    // WebRTC: Handle Call Ended
    const handleCallEnded = () => {
      endCallCleanup();
      toast({ description: "Call ended", variant: "default" });
    };

    // Socket Listeners
 const offHandleIncomingMessage = socketService.on(
      "send:message",
      handleIncomingMessage
    );
    const offHandleImage = socketService.on(
      "send:image",
      handleIncomingMessage
    );
    const offHandleTyping = socketService.on("chat:typing", handleTyping);
    const offHandleEdit = socketService.on("chat:edit", handleEdit);
    const offHandleDelete = socketService.on("chat:delete", handleDelete);
    const offHandleIncomingCall = socketService.on(
      "call:incoming",
      handleIncomingCall
    );
    const offHandleCallAccepted = socketService.on(
      "call:accepted",
      handleCallAccepted
    );
    const offHandleIceCandidate = socketService.on(
      "call:ice-candidate",
      handleIceCandidate
    );
    const offHandleCallEnded = socketService.on("call:ended", handleCallEnded);

    return () => {
      offHandleIncomingMessage();
      offHandleImage();
      offHandleTyping();
      offHandleEdit();
      offHandleDelete();
      offHandleIncomingCall();
      offHandleCallAccepted();
      offHandleIceCandidate();
      offHandleCallEnded();
    };
  }, [dispatch, rideId]);

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

  // Directions Logic
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

  // --- WebRTC Functions ---

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(peerConnectionConfig);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        dispatch(
          emitSocket("call:ice-candidate", {
            receiver: rideDetails.user?.userId,
            candidate: event.candidate,
          })
        );
      }
    };

    pc.ontrack = (event) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    return pc;
  };

  const startCall = async () => {
    try {
      setIsCalling(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.current = stream;

      const pc = createPeerConnection();
      peerConnection.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      dispatch(
        emitSocket("call:start", {
          receiver: rideDetails.user?.userId,
          offer: offer,
        })
      );
    } catch (error) {
      console.error("Error starting call:", error);
      setIsCalling(false);
      toast({ description: "Could not access microphone", variant: "error" });
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.current = stream;

      const pc = createPeerConnection();
      peerConnection.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(
        new RTCSessionDescription(incomingCall.offer)
      );
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      dispatch(
        emitSocket("call:accept", {
          receiver: rideDetails.user?.userId, 
          answer: answer,
        })
      );

      setIncomingCall(null);
      setCallActive(true);
    } catch (error) {
      console.error("Error accepting call:", error);
    }
  };

  const rejectCall = () => {
    dispatch(
      emitSocket("call:end", {
        receiver: rideDetails.user?.userId,
      })
    );

    setIncomingCall(null);
  };

  const endCall = () => {
    dispatch(
      emitSocket("call:end", {
        receiver: rideDetails.user?.userId,
      })
    );

    endCallCleanup();
  };

  const endCallCleanup = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }
    setCallActive(false);
    setIsCalling(false);
    setIncomingCall(null);
    setIsMuted(false);
  };

  const toggleMute = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks()[0].enabled = isMuted;
      setIsMuted(!isMuted);
    }
  };

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

  const openChat = () => {
    setIsChatOpen(true);
    dispatch(markChatAsRead(rideId));
  };

  const handleTypingChange = (value: string) => {
    setMessageInput(value);
    if (!isTyping) {
      setIsTyping(true);
      dispatch(
        emitSocket("chat:typing", {
          receiver: rideDetails.user?.userId,
          isTyping: true,
        })
      );
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      dispatch(
        emitSocket("chat:typing", {
          receiver: rideDetails.user?.userId,
          isTyping: false,
        })
      );
    }, 1000);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const messageId = uuidv4();
    const message: ChatMessage = {
      id: messageId,
      text: messageInput,
      sender: "driver",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    dispatch(addMessage({ rideId, message }));
    dispatch(
      emitSocket("send:message", {
        ...message,
        receiver: rideDetails.user?.userId,
        rideId,
      })
    );

    setMessageInput("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const messageId = uuidv4();
      const message: ChatMessage = {
        id: messageId,
        text: "",
        image: reader.result as string,
        sender: "driver",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      dispatch(addMessage({ rideId, message }));
      dispatch(
        emitSocket("send:image", {
          ...message,
          receiver: rideDetails.user?.userId,
          rideId,
        })
      );
    };
    reader.readAsDataURL(file);
  };

  const handleEditMessage = (msg: ChatMessage) => {
    const newText = prompt("Edit message:", msg.text);
    if (newText && newText.trim() && newText !== msg.text) {
      dispatch(
        editMessage({ rideId, messageId: msg.id, newText: newText.trim() })
      );
      dispatch(
        emitSocket("chat:edit", {
          receiver: rideDetails.user?.userId,
          messageId: msg.id,
          newText: newText.trim(),
        })
      );
    }
  };

  const handleDeleteMessage = (msg: ChatMessage) => {
    if (confirm("Delete this message?")) {
      dispatch(deleteMessage({ rideId, messageId: msg.id }));
      dispatch(
        emitSocket("chat:delete", {
          receiver: rideDetails.user?.userId,
          messageId: msg.id,
        })
      );
    }
  };

  const handleCompleteRide = async () => {
    try {
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
        rideDetails.dropOffCoordinates.latitude,
        rideDetails.dropOffCoordinates.longitude
      );

      if (driverDist > 500) {
        toast({
          description:
            "You're too far from the drop location. You need to be within 500 meters.",
          variant: "error",
        });
        return;
      }
    } catch (error) {
      handleCustomError(error);
    }
  };

  const handleCall = () => {
    startCall();
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
      {/* --- AUDIO ELEMENT FOR CALL --- */}
      <audio ref={remoteAudioRef} autoPlay />

      {/* --- CALL MODALS --- */}

      {/* 1. Incoming Call Modal */}
      {incomingCall && !callActive && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-2xl flex flex-col items-center space-y-4 animate-in fade-in zoom-in">
            <div className="relative">
              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-25"></div>
              <img
                src={
                  rideDetails.user?.userProfile || "/images/default-avatar.png"
                }
                className="w-20 h-20 rounded-full border-4 border-green-500 relative z-10"
              />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-lg">
                {rideDetails.user?.userName}
              </h3>
              <p className="text-gray-500">Incoming Audio Call...</p>
            </div>
            <div className="flex space-x-6">
              <button
                onClick={rejectCall}
                className="p-4 bg-red-500 rounded-full text-white hover:bg-red-600 transition"
              >
                <PhoneOff size={24} />
              </button>
              <button
                onClick={acceptCall}
                className="p-4 bg-green-500 rounded-full text-white hover:bg-green-600 transition animate-bounce"
              >
                <Phone size={24} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Outgoing / Active Call Modal */}
      {(isCalling || callActive) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="flex flex-col items-center space-y-8 text-white">
            <div className="flex flex-col items-center space-y-2">
              <img
                src={
                  rideDetails.user?.userProfile || "/images/default-avatar.png"
                }
                className="w-24 h-24 rounded-full border-4 border-yellow-500 shadow-lg"
              />
              <h2 className="text-2xl font-bold">
                {rideDetails.user?.userName}
              </h2>
              <p className="text-yellow-400 font-medium">
                {callActive ? "Connected" : "Calling..."}
              </p>
              {callActive && (
                <div className="text-sm opacity-70 flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  00:00
                </div>
              )}
            </div>

            <div className="flex items-center space-x-6">
              {/* Mute Button */}
              <button
                onClick={toggleMute}
                className={`p-4 rounded-full transition-all ${
                  isMuted
                    ? "bg-white text-black"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
              </button>

              {/* End Call Button */}
              <button
                onClick={endCall}
                className="p-6 bg-red-500 rounded-full text-white hover:bg-red-600 transition-all shadow-lg hover:scale-105"
              >
                <PhoneOff size={32} />
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* --- Bottom Ride Details Card --- */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4">
        <div className="bg-white backdrop-blur-lg rounded-2xl shadow-2xl border-2 border-yellow-500 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 flex-1">
                <MapPin className="text-yellow-600 flex-shrink-0" size={18} />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-xs">
                    {status === "Accepted" ? "Pickup" : "Drop-off"}
                  </p>
                  <p className="text-gray-900 text-sm font-semibold truncate">
                    {status === "Accepted"
                      ? rideDetails.pickupCoordinates?.address
                      : rideDetails.dropOffCoordinates?.address}
                  </p>
                </div>
              </div>
              <div className="text-right ml-3">
                <p className="text-yellow-600 font-bold text-lg">
                  ₹{rideDetails.price}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="text-yellow-600" size={16} />
                <span className="text-gray-700 text-sm font-medium">
                  {rideDetails.duration}
                </span>
              </div>
              {status === "InRide" && (
                <Button onClick={handleCompleteRide}>Complete Ride</Button>
              )}
              <div className="flex items-center space-x-2">
                {/* CALL BUTTON UPDATED */}
                <button
                  onClick={handleCall}
                  className="bg-green-500 hover:bg-green-600 p-2 rounded-full transition-colors shadow-lg"
                >
                  <Phone className="text-white" size={18} />
                </button>
                <button
                  onClick={openChat}
                  className="relative bg-blue-500 hover:bg-blue-600 p-2 rounded-full transition-colors"
                >
                  <MessageCircle className="text-white" size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="bg-yellow-500 hover:bg-yellow-600 p-2 rounded-full transition-colors shadow-lg"
                >
                  {showDetails ? (
                    <ChevronDown className="text-white" size={18} />
                  ) : (
                    <ChevronUp className="text-white" size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {showDetails && (
            <div className="border-t-2 border-yellow-200 bg-yellow-50 p-4 space-y-4">
              <div className="flex items-center space-x-3">
                <img
                  src={
                    rideDetails.user?.userProfile ||
                    "/images/default-avatar.png"
                  }
                  alt="User"
                  className="w-14 h-14 rounded-full border-2 border-yellow-500"
                />
                <div className="flex-1">
                  <h3 className="text-gray-900 font-bold text-base">
                    {rideDetails.user?.userName}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {rideDetails.user?.userNumber}
                  </p>
                </div>
              </div>

              {status === "Accepted" && (
                <div className="bg-white rounded-xl p-4 border-2 border-yellow-500">
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
          )}
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
                  <p className="text-white/80 text-xs">
                    {userIsTyping ? "Typing..." : "Online"}
                  </p>
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
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === "driver" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl p-3 ${
                      msg.sender === "driver"
                        ? "bg-yellow-500 text-black"
                        : "bg-gray-800 text-white"
                    }`}
                  >
                    {msg.deleted ? (
                      <p className="italic text-gray-500">
                        This message was deleted
                      </p>
                    ) : (
                      <>
                        {msg.image && (
                          <img
                            src={msg.image}
                            alt="Sent"
                            className="rounded-lg mb-2 max-w-full"
                          />
                        )}
                        {msg.text && <p className="text-sm">{msg.text}</p>}
                        <p
                          className={`text-xs mt-1 ${
                            msg.sender === "driver"
                              ? "text-black/70"
                              : "text-gray-400"
                          }`}
                        >
                          {msg.time} {msg.edited && "(edited)"}
                        </p>
                      </>
                    )}

                    {!msg.deleted && msg.sender === "driver" && (
                      <div className="flex justify-end space-x-2 mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditMessage(msg);
                          }}
                          className="text-xs bg-black/20 hover:bg-black/30 px-2 py-1 rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMessage(msg);
                          }}
                          className="text-xs bg-red-500/30 hover:bg-red-500/50 px-2 py-1 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
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
                  onChange={(e) => handleTypingChange(e.target.value)}
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
