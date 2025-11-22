import { CustomerDetails, LocationCoordinates } from "@/shared/types/common";

interface RideDetails {
  rideId: string;
  estimatedDistance: string;
  estimatedDuration: string;
  fareAmount: number;
  vehicleType: string;
  securityPin: number;
}

interface BookingDetails {
  bookingId: string;
  userId: string;
  pickupLocation: LocationCoordinates;
  dropoffLocation: LocationCoordinates;
  rideDetails: RideDetails;
  status: "pending" | "accepted" | "declined" | "cancelled";
  createdAt: string;
}

// interface RideNotificationProps {
//   customer: CustomerDetails;
//   pickup: LocationCoordinates;
//   dropoff: LocationCoordinates;
//   ride: RideDetails;
//   booking: BookingDetails;
//   timeLeft: number;
//   requestTimeout: number;
//   onAccept: () => void;
//   onDecline: () => void;
// }

export type {RideDetails}