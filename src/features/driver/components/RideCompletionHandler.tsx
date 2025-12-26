import { calculateDistance } from "@/shared/utils/getDistanceInMeters";
import { toast } from "@/shared/hooks/use-toast";
import { handleCustomError } from "@/shared/utils/error";
import { RideDetails } from "@/shared/types/common";
import { postData } from "@/shared/services/api/api-service";
import DriverApiEndpoints from "@/constants/driver-api-end-pontes";
import { StatusCode } from "@/shared/types/enum";
import { rideCreate, updateRideStatus } from "@/shared/services/redux/slices/rideSlice";

export const RideCompletionHandler = {
  useHandlers: (dispatch: any, driverLocation: any, rideDetails: RideDetails) => {
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

      const response = await postData(
          DriverApiEndpoints.COMPLETE_RIDE.replace(":rideId", rideDetails.id)
        );

        if(response?.status === StatusCode.OK){
          toast(
            { description: "Ride completed successfully!", variant: "success"}
          )
          dispatch(updateRideStatus({ status: "Completed"}))
        }

      } catch (error) {
        handleCustomError(error);
      }
    };

    return { handleCompleteRide };
  },
};
