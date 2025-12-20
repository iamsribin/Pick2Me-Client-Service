import React from "react";
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";
import { RideDetails } from "@/shared/types/common";

interface CallModalsProps {
  incomingCall: any;
  callActive: boolean;
  isCalling: boolean;
  isMuted: boolean;
  rideDetails: RideDetails;
  onAcceptCall: () => void;
  onRejectCall: () => void;
  onToggleMute: () => void;
  onEndCall: () => void;
}

export const CallModals: React.FC<CallModalsProps> = ({
  incomingCall,
  callActive,
  isCalling,
  isMuted,
  rideDetails,
  onAcceptCall,
  onRejectCall,
  onToggleMute,
  onEndCall,
}) => {
  // Incoming Call Modal
  if (incomingCall && !callActive) {
    return (
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
              onClick={onRejectCall}
              className="p-4 bg-red-500 rounded-full text-white hover:bg-red-600 transition"
            >
              <PhoneOff size={24} />
            </button>
            <button
              onClick={onAcceptCall}
              className="p-4 bg-green-500 rounded-full text-white hover:bg-green-600 transition animate-bounce"
            >
              <Phone size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Outgoing / Active Call Modal
  if (isCalling || callActive) {
    return (
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
            <button
              onClick={onToggleMute}
              className={`p-4 rounded-full transition-all ${
                isMuted
                  ? "bg-white text-black"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
            </button>

            <button
              onClick={onEndCall}
              className="p-6 bg-red-500 rounded-full text-white hover:bg-red-600 transition-all shadow-lg hover:scale-105"
            >
              <PhoneOff size={32} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};