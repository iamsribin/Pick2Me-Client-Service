import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useSocket } from "@/context/socket-context";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { PhoneCall } from "lucide-react";
import { updateRideStatus,setPaymentStatus } from "@/shared/services/redux/slices/driverRideSlice";
import { toast } from "sonner";
import { RideRequest } from "@/shared/types/driver/ride-type";
import { useDriverLocation } from "@/context/driver-location-context";
import { Toast } from "@chakra-ui/react";
import { getDistanceInMeters } from "@/shared/utils/getDistanceInMeters";
import { patchData, postData } from "@/shared/services/api/api-service";
import DriverApiEndpoints from "@/constants/driver-api-end-pontes";
import ApiEndpoints from "@/constants/user-api-end-pointes";
import { useNotification } from "@/shared/hooks/useNotificatiom";

interface TripInfoProps {
  rideData: RideRequest;
}

const TripInfo: React.FC<TripInfoProps> = ({ rideData }) => {
  const dispatch = useDispatch();
 const {onNotification} = useNotification()
  // dispatch(
  //       updateRideStatus({
  //         bookingId: rideData.bookingDetails.bookingId,
  //         status: "started",
  //       })
  //     )
  const { driverLocation } = useDriverLocation();
  const { socket, isConnected } = useSocket();
  const [isTripStarted, setIsTripStarted] = useState<boolean>(
    rideData.bookingDetails.status === "started" ||
      rideData.bookingDetails.status === "completed"
  );
  const [enteredPin, setEnteredPin] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");

  const handlePinSubmit = async () => {
    if (!rideData || !socket || !isConnected || !driverLocation) return;
   
    const payload = {
      securityPin: enteredPin,
      bookingId: rideData.bookingDetails.bookingId,
      rideId: rideData.bookingDetails.rideId
    };
    
    const data = await postData(
      DriverApiEndpoints.CHECK_SECURITY_PIN,
      payload
    );
    
    if (data) {
      setPinError("");
      setIsTripStarted(true);

      if (!driverLocation) {
        Toast({
          title: "Error",
          description: "your location have issue",
          variant: "default",
        });
        return;
      }

      dispatch(
        updateRideStatus({
          bookingId: rideData.bookingDetails.bookingId,
          status: "started",
          driverCoordinates: driverLocation,
        })
      );

      socket.emit("rideStarted", {
        bookingId: rideData.bookingDetails.bookingId,
        userId: rideData.customer.userId,
        driverLocation: driverLocation,
      });

      toast.success("Ride started successfully");
    } else {
      setPinError("Invalid PIN. Please try again.");
    }
  };

  const handleCompleteRide = async() => {
    if (!socket || !rideData || !isConnected || !driverLocation) return;

    const dropLat = rideData.bookingDetails.dropoffLocation.latitude;
    const dropLng = rideData.bookingDetails.dropoffLocation.longitude;
    const driverLat = driverLocation.latitude;
    const driverLng = driverLocation.longitude;

    const distance = getDistanceInMeters(
      driverLat,
      driverLng,
      dropLat,
      dropLng
    );

    const ALLOWED_DISTANCE = 100;

    if (distance > ALLOWED_DISTANCE) {
      toast.error(
        "You are too far from the drop-off location to complete the ride."
      );
      return;
    }
console.log("=======success=======");

    const data = await patchData(ApiEndpoints.COMPLETE_RIDE,"Driver",{
      bookingId: rideData.bookingDetails.bookingId,
      userId: rideData.customer.userId,
    })
    console.log("data",data);
    
    onNotification("success","ride completed successfully","","/driver/payment")
    console.log("][[]",rideData);
    
    // socket.emit("rideCompleted", {
    //   bookingId: rideData.bookingDetails.bookingId,
    //   userId: rideData.customer.userId,
    // }); 

    dispatch(
      updateRideStatus({
        bookingId: rideData.bookingDetails.bookingId,
        status: "completed",
      })
    );
    console.log("completed dis");

    dispatch(setPaymentStatus("pending"));
    console.log("setPaymentStatus dis");

    toast.success("Ride completed successfully");
  };

  const handleCallCustomer = () => {
    if (rideData?.customer?.userNumber) {
      window.open(`tel:${rideData.customer.userNumber}`);
    } else {
      toast.error("Customer phone number not available");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-emerald-200 flex-shrink-0">
          <AvatarImage
            src={rideData.customer.userProfile}
            alt={rideData.customer.userName}
          />
          <AvatarFallback className="text-sm">
            {rideData.customer.userName?.[0] ?? "C"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm sm:text-base truncate">
            {rideData.customer.userName ?? "Customer"}
          </p>
          <p className="text-xs sm:text-sm text-gray-500">
            Vehicle: {rideData.bookingDetails.vehicleType ?? "N/A"}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            size="icon"
            variant="outline"
            className="rounded-full h-8 w-8 sm:h-10 sm:w-10"
            onClick={handleCallCustomer}
          >
            <PhoneCall className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isTripStarted && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-sm mb-3">
            Enter 6-digit PIN to start ride:
          </h3>
          <div className="flex gap-2 mb-3 items-center">
            <Input
              type="text"
              placeholder="Enter PIN"
              value={enteredPin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setEnteredPin(value);
                setPinError("");
              }}
              className="w-32 text-center text-lg font-mono"
              maxLength={6}
            />
            <Button
              onClick={handlePinSubmit}
              className="bg-green-600 hover:bg-green-700 h-10 px-2"
              disabled={enteredPin.length !== 6 || !isConnected}
            >
              Start Ride
            </Button>
          </div>
          {pinError && <p className="text-red-500 text-sm">{pinError}</p>}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Distance:</span>
          <span className="font-medium">
            {rideData.bookingDetails.estimatedDistance ?? "N/A"}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Duration:</span>
          <span className="font-medium">
            {rideData.bookingDetails.estimatedDuration ?? "N/A"}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Fare:</span>
          <span className="font-medium">
            ₹{rideData.bookingDetails.fareAmount ?? "N/A"}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex gap-3 items-start">
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-medium">PICKUP</p>
            <p className="text-sm font-medium leading-tight">
              {rideData.bookingDetails.pickupLocation.address ??
                "Pickup Location"}
            </p>
          </div>
        </div>
        <div className="flex gap-3 items-start">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-medium">DROP-OFF</p>
            <p className="text-sm font-medium leading-tight">
              {rideData.bookingDetails.dropoffLocation.address ??
                "Drop-off Location"}
            </p>
          </div>
        </div>
      </div>

      {isTripStarted && rideData.bookingDetails.status !== "completed" && (
        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleCompleteRide}
            className="flex-1 bg-blue-500 hover:bg-blue-600 h-12"
          >
            Complete Ride
          </Button>
        </div>
      )}
    </div>
  );
};

export default TripInfo;
