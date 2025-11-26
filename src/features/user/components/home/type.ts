interface BackendVehicle {
  vehicleModel: string;
  image: string;
  basePrice: number;
  pricePerKm: number;
  eta: string;
  features: string[];
}


interface VehicleOption {
  id: string;
  name: string;
  image: string;
  price: number;
  pricePerKm: number;
    isAvailable: boolean; 

  eta: string;
  features: string[];
}

export type {BackendVehicle,VehicleOption}