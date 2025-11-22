import React from "react";
import {
  Car,
  MapPin,
  Navigation,
  CreditCard,
  User,
  FileText,
  CheckCircle,
  Calendar,
  Search,
  Shield,
} from "lucide-react";
import { Progress } from "@/shared/components/ui/progress";
import { LoadingType } from "@/shared/types/common";

type LoadingProps = {
  isLoading?: boolean;
  loadingType?: LoadingType | string;
  loadingMessage?: string;
  progress?: number;
  title?:string,
};

interface LoadingConfig {
  icon: React.ReactNode;
  title: string;
  defaultMessage: string;
  color: string;
  bgColor: string;
}

// use string index so custom strings also work
const loadingConfigs: Record<string, LoadingConfig> = {
  "default": {
    icon: <Car className="w-8 h-8" />,
    title: "Loading...",
    defaultMessage: "Please wait",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  "ride-request": {
    icon: <Car className="w-8 h-8" />,
    title: "Requesting Ride",
    defaultMessage: "Finding the best ride for you...",
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
  },
  "ride-search": {
    icon: <Search className="w-8 h-8" />,
    title: "Finding Drivers",
    defaultMessage: "Searching for available drivers nearby...",
    color: "text-orange-500",
    bgColor: "bg-orange-50",
  },
  "ride-tracking": {
    icon: <Navigation className="w-8 h-8" />,
    title: "Tracking Ride",
    defaultMessage: "Getting real-time updates...",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  payment: {
    icon: <CreditCard className="w-8 h-8" />,
    title: "Processing Payment",
    defaultMessage: "Securely processing your payment...",
    color: "text-purple-500",
    bgColor: "bg-purple-50",
  },
  location: {
    icon: <MapPin className="w-8 h-8" />,
    title: "Getting Location",
    defaultMessage: "Accessing your current location...",
    color: "text-red-500",
    bgColor: "bg-red-50",
  },
  profile: {
    icon: <User className="w-8 h-8" />,
    title: "Updating Profile",
    defaultMessage: "Saving your information...",
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
  },
  authentication: {
    icon: <Shield className="w-8 h-8" />,
    title: "Authenticating",
    defaultMessage: "Verifying your credentials...",
    color: "text-cyan-500",
    bgColor: "bg-cyan-50",
  },
  "document-upload": {
    icon: <FileText className="w-8 h-8" />,
    title: "Uploading Documents",
    defaultMessage: "Processing your documents...",
    color: "text-yellow-500",
    bgColor: "bg-yellow-50",
  },
  "driver-verification": {
    icon: <Shield className="w-8 h-8" />,
    title: "Verifying Driver",
    defaultMessage: "Checking driver credentials...",
    color: "text-teal-500",
    bgColor: "bg-teal-50",
  },
  "ride-completion": {
    icon: <CheckCircle className="w-8 h-8" />,
    title: "Completing Ride",
    defaultMessage: "Finalizing your ride...",
    color: "text-green-500",
    bgColor: "bg-green-50",
  },
  booking: {
    icon: <Calendar className="w-8 h-8" />,
    title: "Processing Booking",
    defaultMessage: "Confirming your booking...",
    color: "text-pink-500",
    bgColor: "bg-pink-50",
  },
  "map-loading": {
    icon: <MapPin className="w-8 h-8" />,
    title: "Loading Map",
    defaultMessage: "Preparing map data...",
    color: "text-gray-500",
    bgColor: "bg-gray-50",
  },
};

// small helper components (keep your implementations)
const AnimatedCar: React.FC<{ color: string }> = ({ color }) => (
  <div className="relative">
    <div className={`${color} animate-bounce`}>
      <Car className="w-12 h-12" />
    </div>
    <div className="absolute -bottom-1 left-2">
      <div className="w-2 h-2 bg-gray-800 rounded-full animate-spin"></div>
    </div>
    <div className="absolute -bottom-1 right-2">
      <div className="w-2 h-2 bg-gray-800 rounded-full animate-spin"></div>
    </div>
    <div className="absolute right-full top-1/2 -translate-y-1/2 flex space-x-1">
      <div className="w-6 h-0.5 bg-gray-300 animate-pulse"></div>
      <div className="w-4 h-0.5 bg-gray-300 animate-pulse delay-100"></div>
      <div className="w-2 h-0.5 bg-gray-300 animate-pulse delay-200"></div>
    </div>
  </div>
);

const PulsingIcon: React.FC<{ icon: React.ReactNode; color: string }> = ({ icon, color }) => (
  <div className={`${color} animate-pulse`}>{icon}</div>
);

const Spinner: React.FC<{ color: string }> = ({ color }) => (
  <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${color.replace("text-", "border-")}`}></div>
);

const GlobalLoading: React.FC<LoadingProps> = (props) => {
  // fallback to redux store when props are not provided
  const isLoading = typeof props.isLoading;
  const loadingType = props.loadingType ?? "default";
  const loadingMessage = props.loadingMessage;
  const progress =  props.progress;
  if (!isLoading) return null;
    
  const config = loadingConfigs[loadingType] ?? loadingConfigs["default"];
  const displayMessage = loadingMessage || config.defaultMessage;
  const title = props.title ?? "";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center animate-in fade-in-0 zoom-in-95 duration-300">
        <div className="mb-6 flex justify-center">
          <div className={`${config.bgColor} p-4 rounded-full`}>
            {loadingType === "ride-request" || loadingType === "ride-tracking" ? (
              <AnimatedCar color={config.color} />
            ) : loadingType === "payment" ? (
              <Spinner color={config.color} />
            ) : (
              <PulsingIcon icon={config.icon} color={config.color} />
            )}
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-4 text-sm leading-relaxed">{displayMessage}</p>

        {typeof progress === "number" && (
          <div className="mb-4">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">{progress}% Complete</p>
          </div>
        )}

        <div className="flex justify-center space-x-1">
          <div className={`w-2 h-2 ${config.bgColor} rounded-full animate-pulse`}></div>
          <div className={`w-2 h-2 ${config.bgColor} rounded-full animate-pulse delay-100`}></div>
          <div className={`w-2 h-2 ${config.bgColor} rounded-full animate-pulse delay-200`}></div>
        </div>

        {(loadingType === "ride-search" || loadingType === "ride-request") && (
          <div className="mt-4 text-xs text-gray-500">
            <p>🚗 Finding nearby drivers...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalLoading;
