export interface DriverAuthData {
  name: string;
  token: string;
  driverId: string;
  role: "Driver";
}



// =========^^using^^^=================
// interface DriverDetails {
//   color: string;
//   driverId: string;
//   driverPhoto: string;
//   driverName: string;
//   mobile: number;
//   number: string;
//   rating: number;
//   vehicleModel: string;
//   vehicleNumber: string;
// }


// interface VehicleDetails {
//     registrationId: string;
//     number: string;
//     color: string;
//     model: string;
//     rcFrontImageUrl: string;
//     rcBackImageUrl: string;
//     carFrontImageUrl: string;
//     carBackImageUrl: string;
//     rcStartDate: string;
//     rcExpiryDate: string;
//     insuranceImageUrl: string;
//     insuranceStartDate: string;
//     insuranceExpiryDate: string;
//     pollutionImageUrl: string;
//     pollutionStartDate: string;
//     pollutionExpiryDate: string;
//   }


// export enum AccountStatus {
//   Good = "Good",
//   Warning = "Warning",
//   Rejected = "Rejected",
//   Blocked = "Blocked",
//   Pending = "Pending",
//   Incomplete = "Incomplete",
// }

//  interface DriverInterface {
//   _id: string;

//   name: string;
//   email: string;
//   mobile: number;
//   password: string;
//   adminCommission?: number;
//   driverImage: string;
//   referralCode: string;
//   joiningDate: Date;

//   aadhar: {
//     id: string;
//     frontImageUrl: string;
//     backImageUrl: string;
//   };

//   license: {
//     id: string;
//     frontImageUrl: string;
//     backImageUrl: string;
//     validity: Date;
//   };

//   vehicleDetails: {
//     registrationId: string;
//     vehicleNumber: string;
//     vehicleColor: string;
//     model: string;
//     rcFrontImageUrl: string;
//     rcBackImageUrl: string;
//     carFrontImageUrl: string;
//     carBackImageUrl: string;
//     rcStartDate: Date;
//     rcExpiryDate: Date;
//     insuranceImageUrl: string;
//     insuranceStartDate: Date;
//     insuranceExpiryDate: Date;
//     pollutionImageUrl: string;
//     pollutionStartDate: Date;
//     pollutionExpiryDate: Date;
//   };

//   location: {
//     longitude: string;
//     latitude: string;
//     address: string;
//   };

//   accountStatus: AccountStatus;
//   onlineStatus: boolean;

//   wallet?: {
//     balance: number;
//     transactions: {
//       date: Date;
//       details: string;
//       amount: number;
//       status: "credit" | "debit" | "failed";
//       rideId: string;
//     }[];
//   };

//   totalCompletedRides?: number;
//   totalCancelledRides?: number;

//   rideDetails?: {
//     completedRides: number;
//     cancelledRides: number;
//     Earnings: number;
//     hour: number;
//     date: Date;
//   }[];

//   isAvailable: boolean;

//   totalRatings?: number;

//   feedbacks?: {
//     feedback: string;
//     rideId: string;
//     rating: number;
//     date: Date;
//   }[];

//   createdAt: Date;
//   updatedAt: Date;
// }




// interface Aadhar {
//     id: string;
//     frontImageUrl: string;
//     backImageUrl: string;
//   }
// interface wallet {
//     balance: number;
//     transactions?: {
//       date: Date;
//       details: string;
//       rideId: string;
//       amount: number;
//       status: "credit" | "debit";
//     }[];
//   }

// interface License {
//     id: string;
//     frontImageUrl: string;
//     backImageUrl: string;
//     validity: string;
//   }

// export type {
//   DriverDetails,
//   DriverAuthData,
//   DriverInterface,
//   VehicleDetails,
//   License,
//   Aadhar,
// };
