import { toast } from "sonner";
import { FormikProps } from "formik";
import {
  ResubmissionFormValues,
  Previews,
} from "../types/common";

export const handleFileInput = (
  fieldName: string,
  e: React.ChangeEvent<HTMLInputElement>,
  formik: FormikProps<ResubmissionFormValues>,
  setPreviews: React.Dispatch<React.SetStateAction<Previews>>
) => {
  const file = e.target.files?.[0] || null;
  if (file) {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }
    formik.setFieldValue(fieldName, file);
    const previewUrl = URL.createObjectURL(file);
    const previewKey = fieldName.replace("Image", "") as keyof Previews;
    setPreviews((prev) => ({ ...prev, [previewKey]: previewUrl }));
  } else {
    formik.setFieldValue(fieldName, null);
  }
};

export const handleGeolocation = (
  lat: number,
  lng: number,
  formik: FormikProps<ResubmissionFormValues>,
  setLatitude: React.Dispatch<React.SetStateAction<number>>,
  setLongitude: React.Dispatch<React.SetStateAction<number>>
) => {
  setLatitude(lat);
  setLongitude(lng);
  formik.setFieldValue("latitude", lat);
  formik.setFieldValue("longitude", lng);
};

export const handleGetCurrentLocation = (
  formik: FormikProps<ResubmissionFormValues>,
  setLatitude: React.Dispatch<React.SetStateAction<number>>,
  setLongitude: React.Dispatch<React.SetStateAction<number>>
) => {
  if (!navigator.geolocation) {
    toast.error("Geolocation is not supported by your browser");
    return;
  }

  const options = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0,
  };

  const successCallback = async (position: GeolocationPosition) => {
    const newLat = position.coords.latitude;
    const newLng = position.coords.longitude;
    const accuracy = position.coords.accuracy;

    if (accuracy > 100) {
      toast.info("Waiting for a more accurate location...");
      return;
    }

    formik.setFieldValue("latitude", newLat);
    formik.setFieldValue("longitude", newLng);
    setLatitude(newLat);
    setLongitude(newLng);
  };

  const errorCallback = (error: GeolocationPositionError) => {
    toast.error("Error getting location: " + error.message);
  };

  navigator.geolocation.getCurrentPosition(
    successCallback,
    errorCallback,
    options
  );
};
