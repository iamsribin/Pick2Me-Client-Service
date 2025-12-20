import React from "react";
import { CheckCircle } from "lucide-react";
import { RideDetails } from "@/shared/types/common";

interface CompletedScreenProps {
  rideDetails: RideDetails;
  onBookAnother: () => void;
}

export const CompletedScreen: React.FC<CompletedScreenProps> = ({ rideDetails, onBookAnother }) => (
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
          onClick={onBookAnother}
          className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3 rounded-full transition-all duration-300 shadow-lg"
        >
          Book Another Ride
        </button>
      </div>
    </div>
  </div>
);