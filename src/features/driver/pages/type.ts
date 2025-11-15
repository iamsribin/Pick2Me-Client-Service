import {
  Coordinates,
} from "@/shared/types/common";

interface DriverProfileData {
  name: string;
  email: string;
  mobile: string;
  driverImage: string;
  address: string;
  totalRatings: number;
  joiningDate: Date;
  completedRides: number;
  cancelledRides: number;
  walletBalance: number;
  adminCommission: number;
}

interface BookingListType {
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


interface Aadhar {
  id: string;
  frontImageUrl: string;
  backImageUrl: string;
}

interface License {
  id: string;
  frontImageUrl: string;
  backImageUrl: string;
  validity: Date;
}

interface VehicleRC {
  registrationId: string;
  rcFrontImageUrl: string;
  rcBackImageUrl: string;
  rcStartDate: Date;
  rcExpiryDate: Date;
}

interface VehicleDetails {
  vehicleNumber: string;
  vehicleColor: string;
  model: string;
  carFrontImageUrl: string;
  carBackImageUrl: string;
}

interface Insurance {
  insuranceImageUrl: string;
  insuranceStartDate: Date;
  insuranceExpiryDate: Date;
}

interface Pollution {
  pollutionImageUrl: string;
  pollutionStartDate: Date;
  pollutionExpiryDate: Date;
}

export interface DriverData {
  _id: string;
  aadhar: Aadhar;
  license: License;
  vehicleRC: VehicleRC;
  vehicleDetails: VehicleDetails;
  insurance: Insurance;
  pollution: Pollution;
}

export interface FormData {
  id?: string;
  frontImageUrl?: File | null;
  backImageUrl?: File | null;
  validity?: string;
  registrationId?: string;
  rcStartDate?: string;
  rcFrontImageUrl: File | null;
  carFrontImageUrl: File | null;
  carBackImageUrl: File | null;
  insuranceImageUrl: File | null;
  pollutionImageUrl: File | null;
  rcExpiryDate?: string;
  vehicleNumber?: string;
  vehicleColor?: string;
  model?: string;
  insuranceStartDate?: string;
  insuranceExpiryDate?: string;
  pollutionStartDate?: string;
  pollutionExpiryDate?: string;
}

export interface ImageModal {
  images: string[];
  currentIndex: number;
  title: string;
  isOpen: boolean;
}

export interface ImagePreview {
  [key: string]: string;
}

interface DocumentField {
  key: string;
  label: string;
  type: "text" | "date";
}

interface DocumentImage {
  key: string;
  label: string;
  url: string;
}

interface DisplayData {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  status?: "expired" | "expiring" | "valid";
}

export type DocumentStatus = "expired" | "expiring" | "valid";

export interface DocumentConfig {
  key: string;
  title: string;
  data: Aadhar | License | VehicleRC | VehicleDetails | Insurance | Pollution;
  status?: DocumentStatus;
  fields: DocumentField[];
  images: DocumentImage[];
  displayData: DisplayData[];
}

export type {
  BookingListType,
  DriverProfileData,
}
