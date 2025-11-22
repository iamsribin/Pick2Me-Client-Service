
interface DriverAccountTabProps {
  driver:AdminDriverDetailsDTO;
  onNavigateToTransactions?: (driverId: string) => void;
  onNavigateToFeedback?: (driverId: string) => void;
  onSendCommissionMail?: (driverId: string, commissionAmount: number) => void;
}

// Also add Feedback interface if not already present
interface Feedback {
  id: string;
  rating: number;
  comment: string;
  date: Date;
  rideId?: string;
  customerId?: string;
}

interface DriverDetailsTabProps {
  driver: AdminDriverDetailsDTO;
  note: string;
  setNote: (value: string) => void;
  isRejecting: boolean;
  setIsRejecting: (value: boolean) => void;
  selectedFields: string[];
  setSelectedFields: (value: string[]) => void;
  handleVerification: (
    status: "Rejected" | "Good" | "Blocked",
    fields?: string[]
  ) => void;
}

interface DriverDocumentsTabProps {
  driver: AdminDriverDetailsDTO,
  setSelectedImage: (value: string | undefined) => void;
}

export type {DriverDetailsTabProps,
   DriverDocumentsTabProps, 
  DriverAccountTabProps,
  Feedback
}

export interface Res_getDriversListByAccountStatus {
    id: string;
    name: string;
    email: string;
    mobile: number;
    joiningDate: string;
    accountStatus: "Good" | "Rejected" | "Blocked" | "Pending" | "Incomplete";
    vehicle: string;
    driverImage:string;
  }

export interface AdminDriverDetailsDTO {
  // deatils tab
  id:string;
  driverImage: string;
  name:string;
  email: string;
  mobile: string;
  joiningDate: string;
  address: string;
  todayEarnings: number;
  totalCompletedRides: number;
  totalCancelledRides: number;
  accountStatus: "Good" | "Rejected" | "Blocked" | "Pending" | "Incomplete";
  isOnline:boolean;
  transactionCount:number;
  feedbackCount:number;
  //  documents
  aadhar: {
    id: string;
    frontImageUrl: string;
    backImageUrl: string;
  };

  license: {
    id: string;
    frontImageUrl: string;
    backImageUrl: string;
    validity: string;
  };

  rc: {
    registrationId: string;
    rcFrontImageUrl: string;
    rcBackImageUrl: string;
    rcStartDate: string;
    rcExpiryDate: string;
  };

  insurance: {
    insuranceImageUrl: string;
    insuranceStartDate: string;
    insuranceExpiryDate: string;
  };

  pollution:{
    pollutionImageUrl: string;
    pollutionStartDate: string;
    pollutionExpiryDate: string;
  }

  vehicle:{
    vehicleNumber: string;
    vehicleColor: string;
    model: string;
    carFrontImageUrl: string;
    carBackImageUrl: string;
  }

  walletBalance:number,
  adminCommission:number,
  totalRating:number,
  lifeTimeEarnings:number
}