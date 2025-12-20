import { calculateDistance } from "@/shared/utils/getDistanceInMeters";
import { toast } from "@/shared/hooks/use-toast";
import { handleCustomError } from "@/shared/utils/error";
import { RideDetails } from "@/shared/types/common";

export const RideCompletionHandler = {
  useHandlers: (driverLocation: any, rideDetails: RideDetails) => {
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
        // Proceed with completion API call if needed
      } catch (error) {
        handleCustomError(error);
      }
    };

    return { handleCompleteRide };
  },
};