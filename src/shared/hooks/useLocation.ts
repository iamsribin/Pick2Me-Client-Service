import { LocationContext, LocationContextValue } from "@/context/locationProvider";
import { useContext } from "react";

export const useLocation = (): LocationContextValue => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within LocationProvider");
  return ctx;
};