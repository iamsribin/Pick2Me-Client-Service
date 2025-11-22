import { Coordinates } from "@/shared/types/common";

export interface BookingListType {
  _id: string;
  ride_id: string;
  user_id: string;
  userName: string;
  pickupCoordinates: Coordinates;
  dropoffCoordinates: Coordinates;
  pickupLocation: string;
  dropoffLocation: string;
  driver_id: string;
  distance: string;
  price: number;
  date: Date;
  status: "Pending" | "Accepted" | "Confirmed" | "Completed" | "Cancelled";
  paymentMode?: string;
}