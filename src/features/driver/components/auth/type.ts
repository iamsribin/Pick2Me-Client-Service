import { Previews, ResubmissionData, ResubmissionFormValues } from "@/shared/types/common";
import { FormikProps } from "formik";

interface MapProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
}

interface AadhaarSectionProps {
  formik: FormikProps<ResubmissionFormValues>;
  previews: Previews;
  handleFileInput: (
    field: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  resubmissionData: ResubmissionData;
}

interface DriverImageSectionProps {
  formik: FormikProps<ResubmissionFormValues>;
  previews: Previews;
  handleFileInput: (
    field: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  resubmissionData: ResubmissionData;
}

interface InsurancePollutionSectionProps {
  formik: FormikProps<ResubmissionFormValues>;
  previews: Previews;
  handleFileInput: (
    field: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  resubmissionData: ResubmissionData;
}

interface LicenseSectionProps {
  formik: FormikProps<ResubmissionFormValues>;
  previews: Previews;
  handleFileInput: (
    field: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  resubmissionData: ResubmissionData;
}

interface LocationSectionProps {
  formik: FormikProps<ResubmissionFormValues>;
  latitude: number;
  longitude: number;
  setLatitude: React.Dispatch<React.SetStateAction<number>>;
  setLongitude: React.Dispatch<React.SetStateAction<number>>;
  resubmissionData: ResubmissionData;
}
interface VehicleSectionProps {
  formik: FormikProps<ResubmissionFormValues>;
  previews: Previews;
  handleFileInput: (
    field: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  resubmissionData: ResubmissionData;
}


interface DriverLoginHeaderProps {
  otpInput: boolean;
  load: boolean;
}

interface DriverSignupHeaderProps {
  otpPage: boolean;
  load: boolean;
}

export type {
  AadhaarSectionProps,
  DriverImageSectionProps,
  InsurancePollutionSectionProps,
  LicenseSectionProps,
  LocationSectionProps,
  MapProps,
  VehicleSectionProps,
  DriverLoginHeaderProps,
  DriverSignupHeaderProps,
};
