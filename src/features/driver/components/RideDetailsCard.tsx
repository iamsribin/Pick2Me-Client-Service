import React from "react";
import { MapPin, Clock, Phone, MessageCircle, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { PinEntry } from "./PinEntry";
import { RideDetails } from "@/shared/types/common";

interface RideDetailsCardProps {
  status: string;
  rideDetails: RideDetails;
  showDetails: boolean;
  setShowDetails: React.Dispatch<React.SetStateAction<boolean>>;
  onCall: () => void;
  unreadCount: number;
  onOpenChat: () => void;
  onCompleteRide: () => void;
  pinInput: string[];
  pinError: string;
  onPinChange: (index: number, value: string) => void;
  onPinKeyDown: (index: number, e: React.KeyboardEvent) => void;
  onSubmitPin: () => void;
}

export const RideDetailsCard: React.FC<RideDetailsCardProps> = ({
  status,
  rideDetails,
  showDetails,
  setShowDetails,
  onCall,
  unreadCount,
  onOpenChat,
  onCompleteRide,
  pinInput,
  pinError,
  onPinChange,
  onPinKeyDown,
  onSubmitPin,
}) => (
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
            <Button onClick={onCompleteRide}>Complete Ride</Button>
          )}
          <div className="flex items-center space-x-2">
            <button
              onClick={onCall}
              className="bg-green-500 hover:bg-green-600 p-2 rounded-full transition-colors shadow-lg"
            >
              <Phone className="text-white" size={18} />
            </button>
            <button
              onClick={onOpenChat}
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
            <PinEntry
              pinInput={pinInput}
              pinError={pinError}
              onPinChange={onPinChange}
              onPinKeyDown={onPinKeyDown}
              onSubmitPin={onSubmitPin}
            />
          )}
        </div>
      )}
    </div>
  </div>
);