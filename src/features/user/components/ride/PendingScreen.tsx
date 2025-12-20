import React from "react";
import { Car, MapPin } from "lucide-react";
import { RideDetails } from "@/shared/types/common";

interface PendingScreenProps {
  rideDetails: RideDetails;
}

export const PendingScreen: React.FC<PendingScreenProps> = ({ rideDetails }) => (
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