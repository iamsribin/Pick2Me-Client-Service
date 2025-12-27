
export type Role = "Admin" | "Driver" | "User";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface AdminAllowedVehicleModel {
  _id: string;
  vehicleModel: string;
  image: string;
  minDistanceKm: string;
  basePrice: number;
  pricePerKm: number;
  eta: string;
  features: string[];
}


export interface NotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

export interface ResubmissionData {
  driverId: string;
  fields: string[];
}

export interface ResubmissionFormValues {
  aadharID: string;
  aadharFrontImage: File | null;
  aadharBackImage: File | null;
  licenseID: string;
  licenseFrontImage: File | null;
  licenseBackImage: File | null;
  licenseValidity: string;
  registrationId: string;
  model: string;
  rcFrontImage: File | null;
  rcBackImage: File | null;
  carFrontImage: File | null;
  carBackImage: File | null;
  insuranceImage: File | null;
  insuranceStartDate: string;
  insuranceExpiryDate: string;
  pollutionImage: File | null;
  pollutionStartDate: string;
  pollutionExpiryDate: string;
  driverImage: File | null;
  latitude: number;
  longitude: number;
}



export interface Previews {
  aadharFront: string | null;
  aadharBack: string | null;
  licenseFront: string | null;
  licenseBack: string | null;
  rcFront: string | null;
  rcBack: string | null;
  carFront: string | null;
  carBack: string | null;
  insurance: string | null;
  pollution: string | null;
  driverImage: string | null;
}

export type SocketEvent =
  | { type: 'driver.location'; payload: DriverLocationMessage }
  // | { type: 'ride.status'; payload: RideStatusMessage }
  | { type: 'notification'; payload: NotificationMessage }
  | { type: string; payload: any }; 

  export interface ResponseCom{
 data :any
}
export type RideStatus = "Pending" | "Accepted" | "InRide" | "Completed" | "Cancelled" | ""
export interface DriverLocationMessage {
  rideId: string;
  driverId: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  ts: number;      // device epoch ms
  serverTs?: number; // server epoch ms (optional)
  seq?: number;    // monotonic sequence
  id?: string;
}


export interface LocationCoordinates {
    address: string;
    latitude: number;
    longitude: number;
}
export interface UserInfo {
  userId: string;
  userName: string;
  userNumber: string;
  userProfile: string;
}

export interface DriverInfo {
  driverId: string;
  driverName: string;
  // rating: number;
  // vehicleModel: string;
  driverNumber: string;
  driverProfile: string;
  carBackImageUrl:string;
  carFrontImageUrl:string;
}
export interface RideDetails {
  id: string;
  user: UserInfo;
  driver?:DriverInfo;
  pin: number;
  pickupCoordinates: LocationCoordinates;
  dropOffCoordinates: LocationCoordinates;
  vehicleModel: string;
  price: number;
  duration: string;
  distanceInfo: { distance: string; distanceInKm: number };
  status: ""| "Pending" | "Accepted" | "InRide" | "Completed" | "Cancelled";
  paymentStatus: "Pending" | "Failed" | "Completed" | "idle";
  paymentMode: "Cash" | "Wallet" | "Strip";
  rideId: string;
  date: Date;
}

// export interface PaymentStatus {
//   status: 'ide'|'failed'|'success'|'pending';
//   updatedAt: string;
//   meta?: Record<string, any>;
//   id: string; 
// }

export interface NotificationMessage {
  id: string;
  receiverId: string;
  title: string;
  body: string;
  type: 'system'|'ride'|'payment';
  date: string;
  read?: boolean;
}


//loading
export type LoadingType = 
  | 'default'           // General loading
  | 'ride-request'      // Requesting a ride
  | 'ride-search'       // Searching for drivers
  | 'ride-tracking'     // Tracking active ride
  | 'payment'           // Processing payment
  | 'location'          // Getting location
  | 'profile'           // Profile operations
  | 'authentication'    // Login/signup
  | 'document-upload'   // Document verification
  | 'driver-verification' // Driver verification process
  | 'ride-completion'   // Completing ride
  | 'booking'           // Booking operations
  | 'map-loading';      // Map initialization

  
  // ===================^^^using^^^^===============================
  // export interface LoadingState {
  //   isLoading: boolean;
  //   loadingType: LoadingType;
  //   loadingMessage?: string;
  //   progress?: number; // For operations that can show progress (0-100)
  // }
  
  // const initialState: LoadingState = {
  //   isLoading: false,
  //   loadingType: 'default',
  //   loadingMessage: undefined,
  //   progress: undefined,
  // };
  
  // export interface SetLoadingPayload {
  //   isLoading: boolean;
  //   loadingType?: LoadingType;
  //   loadingMessage?: string;
  //   progress?: number;
  // }

// interface Message {
//   sender: "driver" | "user";
//   content: string;
//   timestamp: string;
//   type: "text" | "image";
//   fileUrl?: string;
// }

// interface NotificationState {
//   open: boolean;
//   type: "success" | "error" | "info";
//   title: string;
//   message: string;
// }

// interface LocationCoordinates {
//   latitude: number;
//   longitude: number;
//   address:string;
// }

// interface Feedback {
//     feedback: string;
//     rideId: string;
//     rating: number;
//     date: string;
//   }

// interface Transaction {
//   status: "Credited" | "Debited";
//   details: string;
//   date: string;
//   amount: number;
// }
// interface Wallet {
//   balance: number;
//   transactions: Transaction[];
// }

// interface RideDetailsForBooking {
//   rideId: string;
//   estimatedDistance: string;
//   estimatedDuration: string;
//   fareAmount: number;
//   vehicleType: string;
//   securityPin: number;
// }


// interface CustomerDetails {
//   id: string;
//   name: string;
//   profileImageUrl?: string;
//   number?:string
// }



// export type {
//   Previews,
//   Coordinates,
//   Message,
//   NotificationState,
//   LocationCoordinates,
//   Feedback,
//   Wallet,
//   Transaction,
//   RideDetailsForBooking,
//   CustomerDetails,
//   ResubmissionData,
//   NotificationDialogProps,
//   ResubmissionFormValues,
//   AdminAllowedVehicleModel
// };

