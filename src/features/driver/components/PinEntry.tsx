import React from "react";
import { AlertCircle } from "lucide-react";
import { calculateDistance } from "@/shared/utils/getDistanceInMeters";
import { postData } from "@/shared/services/api/api-service";
import DriverApiEndpoints from "@/constants/driver-api-end-pontes";
import { toast } from "@/shared/hooks/use-toast";
import { handleCustomError } from "@/shared/utils/error";
import { RideDetails } from "@/shared/types/common";

interface PinEntryProps {
  pinInput: string[];
  pinError: string;
  onPinChange: (index: number, value: string) => void;
  onPinKeyDown: (index: number, e: React.KeyboardEvent) => void;
  onSubmitPin: () => void;
}

export const PinEntry: React.FC<PinEntryProps> = ({
  pinInput,
  pinError,
  onPinChange,
  onPinKeyDown,
  onSubmitPin,
}) => (
  <div className="bg-white rounded-xl p-4 border-2 border-yellow-500">
    <p className="text-gray-700 text-sm text-center mb-3 font-semibold">
      Enter Pickup PIN
    </p>
    <div className="flex justify-center space-x-2 mb-3">
      {pinInput.map((digit, idx) => (
        <input
          key={idx}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => onPinChange(idx, e.target.value)}
          onKeyDown={(e) => onPinKeyDown(idx, e)}
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
      onClick={onSubmitPin}
      className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold py-2 rounded-full transition-all duration-300 shadow-lg"
    >
      Start Ride
    </button>
  </div>
);

