/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import "mapbox-gl/dist/mapbox-gl.css";
import SignupMap from "./SignupMap";
import { useJsApiLoader } from "@react-google-maps/api";
import { coordinatesToAddress } from "@/shared/utils/locationToAddress";
import { getItem, removeItem } from "@/shared/utils/localStorage";
import { postData } from "@/shared/services/api/api-service";
import DriverApiEndpoints from "@/constants/driver-api-end-pontes";
// import { openPendingModal } from "@/shared/services/redux/slices/pendingModalSlice";
import { useDispatch } from "react-redux";
import { FaMapMarkerAlt, FaCrosshairs, FaCheckCircle } from "react-icons/fa";
import { toast } from "@/shared/hooks/use-toast";
import { handleCustomError } from "@/shared/utils/error";

function DriverLocation() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isGeolocationActive, setIsGeolocationActive] = useState(false);
  const [latitude, setLatitude] = useState(23.22639);
  const [longitude, setLongitude] = useState(79.17271);
  const [load, setLoad] = useState(false);
  const libraries: "places"[] = ["places"];

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_API_KEY,
    libraries,
  });

  const handleGeolocation = (lat: number, lng: number, status: any) => {
    setLatitude(lat);
    setLongitude(lng);
    formik.setFieldValue("latitude", lat);
    formik.setFieldValue("longitude", lng);
    setIsGeolocationActive(false);
  };

  const handleGetCurrentLocation = () => {
    setIsGeolocationActive(true);
  };

  const formik = useFormik({
    initialValues: {
      latitude: latitude,
      longitude: longitude,
    },
    validationSchema: Yup.object({
      latitude: Yup.number()
        .min(8.4, "Choose a valid location in India")
        .max(37.6, "Choose a valid location in India"),
      longitude: Yup.number()
        .min(68.7, "Choose a valid location in India")
        .max(97.25, "Choose a valid location in India"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      if (isLoaded) {
        try {
          setLoad(true);
          const address = await coordinatesToAddress(
            values.latitude,
            values.longitude
          );
          const driverId = getItem("driverId");

          if (!driverId) {
            toast({
              description: "Driver ID not found. Please try again.",
              variant: "error",
            });
            removeItem("currentStep");
            navigate("/driver/signup");
            return;
          }

          setSubmitting(true);
          const requestData = {
            ...values,
            address,
          };
         const res = await postData(
            `${DriverApiEndpoints.REGISTER_LOCATION}?driverId=${driverId}`,
            requestData
          );
          if(res && res.status === 200){
toast({
    description:
      "Successfully completed registration! Please wait for admin verification.",
    variant: "success",
  });

  removeItem("driverId");
  removeItem("currentStep");

  navigate("/driver/login", {
    state: { showPendingModal: true },
  });
          }
        } catch (error) {
        handleCustomError(error);
        }
      }
    },
  });

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/pick2me-bg.png')",
          filter: "brightness(0.7)",
        }}
      />

      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <div className="hidden lg:flex flex-col justify-center space-y-6 text-white">
            <h1 className="text-5xl xl:text-6xl font-bold leading-tight">
              Set Your <span className="text-yellow-400">Location</span>
            </h1>
            <p className="text-xl text-gray-200">
              Choose your preferred operating area to start receiving ride
              requests
            </p>

            <div className="space-y-4 mt-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                  <FaMapMarkerAlt className="text-gray-900 text-xl" />
                </div>
                <span className="text-lg">Set your service area</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-900"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                </div>
                <span className="text-lg">Get nearby ride requests</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-900"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <span className="text-lg">Start earning immediately</span>
              </div>
            </div>
          </div>

          {/* Right Side - Map and Form */}
          <div className="w-full">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-10">
              {/* Header */}
              <div className="text-center mb-6 lg:hidden">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Choose Your <span className="text-yellow-600">Location</span>
                </h2>
                <p className="text-gray-600">
                  Set your service area on the map
                </p>
              </div>

              <div className="hidden lg:block text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Select Location
                </h2>
                <p className="text-gray-600">
                  Pinpoint your preferred service area
                </p>
              </div>

              <form onSubmit={formik.handleSubmit} className="space-y-6">
                {/* Map Container */}
                <div className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-200">
                  <div className="flex items-center mb-3">
                    <div className="bg-yellow-100 rounded-full p-2 mr-3">
                      <FaMapMarkerAlt className="text-yellow-600 text-lg" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Interactive Map
                    </h3>
                  </div>

                  {/* Map */}
                  <div className="relative">
                    <div className="w-full h-80 md:h-96 rounded-xl overflow-hidden shadow-lg border-2 border-gray-300">
                      <SignupMap
                        latitude={latitude}
                        longitude={longitude}
                        handleGeolocation={handleGeolocation}
                        isGeolocationActive={isGeolocationActive}
                      />
                    </div>

                    {/* Map Overlay Info */}
                    <div className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FaMapMarkerAlt className="text-yellow-600" />
                          <span className="text-sm font-semibold text-gray-900">
                            Drag map to select location
                          </span>
                        </div>
                        {isGeolocationActive && (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
                            <span className="text-xs text-gray-600">
                              Locating...
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Validation Errors */}
                {(formik.touched.latitude || formik.touched.longitude) &&
                  (formik.errors.latitude || formik.errors.longitude) && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <svg
                          className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div>
                          <h4 className="font-semibold text-red-900 text-sm">
                            Location Error
                          </h4>
                          <p className="text-sm text-red-700 mt-1">
                            {formik.errors.latitude || formik.errors.longitude}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Get Current Location Button */}
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={isGeolocationActive}
                    className="flex items-center justify-center space-x-2 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 font-semibold py-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaCrosshairs
                      className={`text-xl ${
                        isGeolocationActive ? "animate-spin" : ""
                      }`}
                    />
                    <span>Current Location</span>
                  </button>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={load}
                    className="flex items-center justify-center space-x-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {load ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <FaCheckCircle className="text-xl" />
                        <span>Confirm Location</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Info Notice */}
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <svg
                      className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">
                        Quick Tip
                      </h4>
                      <p className="text-sm text-gray-700 mt-1">
                        You can drag the map or use "Current Location" to set
                        your preferred service area. This helps us connect you
                        with nearby riders.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DriverLocation;
