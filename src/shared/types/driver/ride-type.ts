// import { RideDetails } from "@/features/driver/components/type";
// import {
//   // BookingDetails,
//   CustomerDetails,
//   LocationCoordinates,
//   Message,
// } from "../commonTypes";

// interface DriverRideRequestSlice {
//   requestId: string;
//   customer: CustomerDetails;
//   pickup: LocationCoordinates;
//   dropoff: LocationCoordinates;
//   ride: RideDetails;
//   booking: BookingDetails;
//   requestTimeout: number;
//   requestTimestamp: string;
//   chatMessages: Message[];
//   status: "accepted" | "started" | "completed" | "cancelled" | "failed";
// }

// interface BookingDetails {
//   bookingId: string;
//   rideId: string;
//   estimatedDistance: string;
//   estimatedDuration: string;
//   fareAmount: number;
//   vehicleType: string;
//   securityPin: number;
//   pickupLocation: LocationCoordinates;
//   dropoffLocation: LocationCoordinates;
//   status: string;
//   createdAt: Date;
// }

// export interface UserInfo {
//   userId: string;
//   userName: string;
//   userNumber: string;
//   userProfile: string;
// }

// export interface RideRequest {
//   customer: UserInfo;
//   bookingDetails: BookingDetails;
//   chatMessages: Message[];
//   requestTimeout: number;
// }

// export type{DriverRideRequestSlice}
