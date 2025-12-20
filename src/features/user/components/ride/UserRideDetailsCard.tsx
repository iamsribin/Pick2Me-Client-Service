import React from "react";
import { MapPin, Clock, Phone, MessageCircle, ChevronUp, ChevronDown, Navigation, Car } from "lucide-react";
import { RideDetails } from "@/shared/types/common";

interface UserRideDetailsCardProps {
  status: string;
  rideDetails: RideDetails;
  showDetails: boolean;
  setShowDetails: React.Dispatch<React.SetStateAction<boolean>>;
  showCarImages: boolean;
  setShowCarImages: React.Dispatch<React.SetStateAction<boolean>>;
  onCall: () => void;
  unreadCount: number;
  onOpenChat: () => void;
}

export const UserRideDetailsCard: React.FC<UserRideDetailsCardProps> = ({
  status,
  rideDetails,
  showDetails,
  setShowDetails,
  showCarImages,
  setShowCarImages,
  onCall,
  unreadCount,
  onOpenChat,
}) => (
  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4">
    <div className="bg-black/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-yellow-500/30 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 flex-1">
            <MapPin className="text-yellow-500 flex-shrink-0" size={18} />
            <div className="flex-1 min-w-0">
              <p className="text-gray-400 text-xs">
                {status === "Accepted" ? "Pickup" : "Destination"}
              </p>
              <p className="text-white text-sm font-semibold truncate">
                {status === "Accepted"
                  ? rideDetails.pickupCoordinates?.address
                  : rideDetails.dropOffCoordinates?.address}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="text-yellow-500" size={16} />
            <span className="text-white text-sm font-medium">
              {rideDetails.duration}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onCall}
              className="bg-green-500 hover:bg-green-600 p-2 rounded-full transition-colors"
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
              className="bg-yellow-500 hover:bg-yellow-600 p-2 rounded-full transition-colors"
            >
              {showDetails ? (
                <ChevronDown className="text-black" size={18} />
              ) : (
                <ChevronUp className="text-black" size={18} />
              )}
            </button>
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="border-t border-yellow-500/30 bg-gray-800/50 p-4 space-y-4">
          <div className="flex items-center space-x-3">
            <img
              src={
                rideDetails?.driver?.driverProfile ||
                "/images/default-avatar.png"
              }
              alt="Driver"
              className="w-14 h-14 rounded-full border-2 border-yellow-500"
            />
            <div className="flex-1">
              <h3 className="text-white font-bold text-base">
                {rideDetails?.driver?.driverName}
              </h3>
              <p className="text-gray-400 text-sm">
                {rideDetails.vehicleModel}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <Navigation className="text-yellow-500" size={12} />
                <span className="text-yellow-500 text-xs font-semibold">
                  On the way
                </span>
              </div>
            </div>
          </div>

          {(rideDetails?.driver?.carFrontImageUrl ||
            rideDetails?.driver?.carBackImageUrl) && (
            <button
              onClick={() => setShowCarImages(!showCarImages)}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Car size={18} />
              <span className="text-sm font-medium">
                {showCarImages ? "Hide" : "View"} Vehicle Photos
              </span>
            </button>
          )}

          {showCarImages && (
            <div className="space-y-3">
              {rideDetails?.driver?.carFrontImageUrl && (
                <div className="bg-black/50 rounded-lg p-2">
                  <p className="text-gray-400 text-xs mb-2">Front View</p>
                  <img
                    src={rideDetails.driver.carFrontImageUrl}
                    alt="Car Front"
                    className="w-full rounded-lg"
                  />
                </div>
              )}
              {rideDetails?.driver?.carBackImageUrl && (
                <div className="bg-black/50 rounded-lg p-2">
                  <p className="text-gray-400 text-xs mb-2">Back View</p>
                  <img
                    src={rideDetails.driver.carBackImageUrl}
                    alt="Car Back"
                    className="w-full rounded-lg"
                  />
                </div>
              )}
            </div>
          )}

          {status === "Accepted" && (
            <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 rounded-xl p-4 border border-yellow-500/50">
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
      )}
    </div>
  </div>
);