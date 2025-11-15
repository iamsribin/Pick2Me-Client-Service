import { useFormik } from "formik";
import { useState, useEffect } from "react";
import { VehicleValidation } from "@/shared/utils/validation";
import DriverInsurancePage from "./DriverInsurancePage";
import { VehicleFormValues } from "./type";
import { AdminAllowedVehicleModel } from "@/shared/types/common";
import { fetchData, postData } from "@/shared/services/api/api-service";
import DriverApiEndpoints from "@/constants/driver-api-end-pontes";
import { getItem, removeItem, setItem } from "@/shared/utils/localStorage";
import { CommonApiEndPoint } from "@/constants/common-api-ent-point";
import { FaCar, FaIdCard, FaCalendarAlt, FaUpload, FaPalette } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "@/shared/hooks/use-toast";
import { handleCustomError } from "@/shared/utils/error";
import { Button } from "@/shared/components/ui/button";

function Vehicle() {
  const [insurancePage, setInsurancePage] = useState(false);
  const [load, setLoad] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<AdminAllowedVehicleModel | null>(null);
  const navigate = useNavigate();
  const [previews, setPreviews] = useState({
    rcFrontImage: null as string | null,
    rcBackImage: null as string | null,
    carFrontImage: null as string | null,
    carSideImage: null as string | null,
  });

        const driverId = getItem("driverId");

        useEffect(() => {
          if (!driverId) {
          toast({description:"Driver ID not found. Please register again.", variant: "error"});
          navigate("/driver/signup");
          removeItem("currentStep");
          setLoad(false);
          return;
        }
        }, []);

  const initialValues: VehicleFormValues = {
    registrationId: "",
    model: "",
    vehicleColor: "",
    vehicleNumber: "",
    rcFrontImage: null,
    rcBackImage: null,
    carFrontImage: null,
    carSideImage: null,
    rcStartDate: "",
    rcExpiryDate: "",
  };

  const formik = useFormik<VehicleFormValues>({
    initialValues,
    validationSchema: VehicleValidation,
    onSubmit: async (values) => {
      try {
        setLoad(true);
        const formData = new FormData();
        Object.keys(values).forEach((key) => {
          const value = values[key as keyof VehicleFormValues];
          if (value !== null) {
            formData.append(key, value);
          }
        });

       const res = await postData(
          `${DriverApiEndpoints.DRIVER_ADD_VEHICLE_DETAILS}?driverId=${driverId}`,
          formData
        );
        
        if(res?.status === 200){
          toast({description:"Vehicle details submitted successfully", variant: "success"});
          setItem("currentStep", "insurance")
          setLoad(false);
          setInsurancePage(true);
        }
      } catch (error) {    
        setLoad(false);            
        handleCustomError(error)
      }
    },
  });

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: keyof VehicleFormValues
  ) => {
    const file = e.currentTarget.files?.[0];
    if (file) {
      formik.setFieldValue(fieldName, file);
      const imageUrl = URL.createObjectURL(file);
      setPreviews((prev) => ({ ...prev, [fieldName]: imageUrl }));
    } else {
      formik.setFieldValue(fieldName, null);
      setPreviews((prev) => ({ ...prev, [fieldName]: null }));
    }
  };

  const [vehicleModels, setVehicleModels] = useState<AdminAllowedVehicleModel[]>([]);

useEffect(() => {
  const fetchVehicleModels = async () => {
    try {
      const res = await fetchData<AdminAllowedVehicleModel[]>(CommonApiEndPoint.VEHICLE_MODELS);
     const value =res?.data;
      if (value && value?.length > 0) {
        setVehicleModels(value);
      } else {
        // fallback dummy data for development/testing
        setVehicleModels([
          {
            _id: "1",
            vehicleModel: "Suzuki Alto",
            image: "/images/sedan.png",
            minDistanceKm: "3",
            basePrice: 50,
            pricePerKm: 10,
            eta: "5 min",
            features: ["AC", "4 Seater", "Music System"],
          },
          {
            _id: "2",
            vehicleModel: "Toyota Innova",
            image: "https://cdn.pixabay.com/photo/2016/03/27/21/16/toyota-1283348_1280.jpg",
            minDistanceKm: "5",
            basePrice: 100,
            pricePerKm: 15,
            eta: "8 min",
            features: ["AC", "7 Seater", "Spacious", "Comfort Ride"],
          },
          {
            _id: "3",
            vehicleModel: "Hyundai i20",
            image: "https://cdn.pixabay.com/photo/2018/04/04/18/12/car-3296040_1280.jpg",
            minDistanceKm: "4",
            basePrice: 70,
            pricePerKm: 12,
            eta: "6 min",
            features: ["AC", "4 Seater", "Bluetooth Audio"],
          },
        ]);
      }
    } catch (error) {
              // fallback dummy data for development/testing
        setVehicleModels([
          {
            _id: "1",
            vehicleModel: "Suzuki Alto",
            image: "/images/sedan.png",
            minDistanceKm: "3",
            basePrice: 50,
            pricePerKm: 10,
            eta: "5 min",
            features: ["AC", "4 Seater", "Music System"],
          },
          {
            _id: "2",
            vehicleModel: "Toyota Innova",
            image: "https://cdn.pixabay.com/photo/2016/03/27/21/16/toyota-1283348_1280.jpg",
            minDistanceKm: "5",
            basePrice: 100,
            pricePerKm: 15,
            eta: "8 min",
            features: ["AC", "7 Seater", "Spacious", "Comfort Ride"],
          },
          {
            _id: "3",
            vehicleModel: "Hyundai i20",
            image: "https://cdn.pixabay.com/photo/2018/04/04/18/12/car-3296040_1280.jpg",
            minDistanceKm: "4",
            basePrice: 70,
            pricePerKm: 12,
            eta: "6 min",
            features: ["AC", "4 Seater", "Bluetooth Audio"],
          },
        ]);
      handleCustomError(error);
    }
  };

  fetchVehicleModels();
}, []);


  const handleVehicleSelect = (vehicle: AdminAllowedVehicleModel) => {
    setSelectedVehicle(vehicle);
    formik.setFieldValue("model", vehicle.vehicleModel);
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    return () => {
      Object.values(previews).forEach((url) => url && URL.revokeObjectURL(url));
    };
  }, [previews]);

  return (
    <>
      {insurancePage ? (
        <DriverInsurancePage />
      ) : (
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
                  Register Your <span className="text-yellow-400">Vehicle</span>
                </h1>
                <p className="text-xl text-gray-200">
                  Tell us about your vehicle to start earning
                </p>
                
                <div className="space-y-4 mt-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                      <FaCar className="text-gray-900 text-xl" />
                    </div>
                    <span className="text-lg">Multiple vehicle support</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <span className="text-lg">Secure verification</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-lg">Quick approval</span>
                  </div>
                </div>
              </div>

              {/* Right Side - Form */}
              <div className="w-full">
                <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-10 max-h-[85vh] overflow-y-auto scrollbar-hide">
                  {/* Header */}
                  <div className="text-center mb-8 lg:hidden">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      Vehicle <span className="text-yellow-600">Details</span>
                    </h2>
                    <p className="text-gray-600">Register your vehicle information</p>
                  </div>

                  <div className="hidden lg:block text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      Vehicle Information
                    </h2>
                    <p className="text-gray-600">Complete your vehicle registration</p>
                  </div>

                  <form onSubmit={formik.handleSubmit} className="space-y-6">
                    {/* Basic Vehicle Info */}
                    <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                      <div className="flex items-center mb-4">
                        <FaCar className="text-yellow-600 text-2xl mr-3" />
                        <h3 className="text-xl font-bold text-gray-900">Basic Information</h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Vehicle Number */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Vehicle Number
                          </label>
                          <input
                            className="w-full px-4 py-3 bg-white rounded-xl border-2 border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none transition-colors"
                            type="text"
                            name="vehicleNumber"
                            placeholder="e.g., KL-01-AB-1234"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.vehicleNumber}
                          />
                          {formik.touched.vehicleNumber && formik.errors.vehicleNumber && (
                            <p className="text-red-500 text-sm mt-1">{formik.errors.vehicleNumber}</p>
                          )}
                        </div>

                        {/* Vehicle Color */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            <FaPalette className="mr-2 text-gray-500" />
                            Vehicle Color
                          </label>
                          <input
                            className="w-full px-4 py-3 bg-white rounded-xl border-2 border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none transition-colors"
                            type="text"
                            name="vehicleColor"
                            placeholder="e.g., White, Black"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.vehicleColor}
                          />
                          {formik.touched.vehicleColor && formik.errors.vehicleColor && (
                            <p className="text-red-500 text-sm mt-1">{formik.errors.vehicleColor}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        {/* Registration ID */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Registration ID
                          </label>
                          <input
                            className="w-full px-4 py-3 bg-white rounded-xl border-2 border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none transition-colors"
                            type="text"
                            name="registrationId"
                            placeholder="Enter RC number"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.registrationId}
                          />
                          {formik.touched.registrationId && formik.errors.registrationId && (
                            <p className="text-red-500 text-sm mt-1">{formik.errors.registrationId}</p>
                          )}
                        </div>

                        {/* Vehicle Model Dropdown */}
                        <div className="relative">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Vehicle Model
                          </label>
                          <Button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full px-4 py-3 text-left bg-white rounded-xl border-2 border-gray-300 focus:border-yellow-400 outline-none transition-colors flex items-center justify-between"
                          >
                            <span className={selectedVehicle ? "text-gray-900" : "text-gray-400"}>
                              {selectedVehicle ? selectedVehicle.vehicleModel : "Select vehicle model"}
                            </span>
                            <svg
                              className={`w-5 h-5 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </Button>

                          {/* Dropdown */}
                          {isDropdownOpen && (
                            <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-300 rounded-xl shadow-xl max-h-72 overflow-y-auto">
                              {vehicleModels.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-500">No vehicle models available</div>
                              ) : (
                                vehicleModels.map((vehicle) => (
                                  <div
                                    key={vehicle._id}
                                    onClick={() => handleVehicleSelect(vehicle)}
                                    className="flex items-center p-3 hover:bg-yellow-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                                  >
                                    <div className="flex-shrink-0 w-12 h-12 mr-3">
                                      <img
                                        src={vehicle.image}
                                        alt={vehicle.vehicleModel}
                                        className="w-full h-full object-cover rounded-lg"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = "/images/default-vehicle.png";
                                        }}
                                      />
                                    </div>
                                    <div className="flex-grow">
                                      <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-semibold text-sm text-gray-900">{vehicle.vehicleModel}</h3>
                                        <span className="text-xs text-yellow-600 font-medium">ETA: {vehicle.eta}</span>
                                      </div>
                                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                        <span>Base: ₹{vehicle.basePrice}</span>
                                        <span>Per km: ₹{vehicle.pricePerKm}</span>
                                        <span>Min: {vehicle.minDistanceKm}km</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {vehicle.features.slice(0, 2).map((feature, index) => (
                                          <span key={index} className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                            {feature}
                                          </span>
                                        ))}
                                        {vehicle.features.length > 2 && (
                                          <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                            +{vehicle.features.length - 2} more
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}

                          {/* Selected Vehicle Preview */}
                          {selectedVehicle && (
                            <div className="mt-3 p-3 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={selectedVehicle.image}
                                  alt={selectedVehicle.vehicleModel}
                                  className="w-10 h-10 object-cover rounded-lg"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/images/default-vehicle.png";
                                  }}
                                />
                                <div>
                                  <p className="font-semibold text-sm text-gray-900">{selectedVehicle.vehicleModel}</p>
                                  <p className="text-xs text-gray-700">
                                    Base: ₹{selectedVehicle.basePrice} | Per km: ₹{selectedVehicle.pricePerKm}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {formik.touched.model && formik.errors.model && (
                            <p className="text-red-500 text-sm mt-1">{formik.errors.model}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RC Document Images */}
                    <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                      <div className="flex items-center mb-4">
                        <FaIdCard className="text-yellow-600 text-2xl mr-3" />
                        <h3 className="text-xl font-bold text-gray-900">RC Documents</h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* RC Front */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">RC Front</label>
                          <input
                            type="file"
                            name="rcFrontImage"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, "rcFrontImage")}
                            className="hidden"
                            id="rcFrontImage"
                          />
                          <label
                            htmlFor="rcFrontImage"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-yellow-400 transition-colors bg-white"
                          >
                            {previews.rcFrontImage ? (
                              <img src={previews.rcFrontImage} alt="RC Front" className="h-full w-full object-contain rounded-xl" />
                            ) : (
                              <>
                                <FaUpload className="text-gray-400 text-2xl mb-2" />
                                <span className="text-sm text-gray-500">Upload RC Front</span>
                              </>
                            )}
                          </label>
                          {formik.touched.rcFrontImage && formik.errors.rcFrontImage && (
                            <p className="text-red-500 text-sm mt-1">{formik.errors.rcFrontImage}</p>
                          )}
                        </div>

                        {/* RC Back */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">RC Back</label>
                          <input
                            type="file"
                            name="rcBackImage"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, "rcBackImage")}
                            className="hidden"
                            id="rcBackImage"
                          />
                          <label
                            htmlFor="rcBackImage"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-yellow-400 transition-colors bg-white"
                          >
                            {previews.rcBackImage ? (
                              <img src={previews.rcBackImage} alt="RC Back" className="h-full w-full object-contain rounded-xl" />
                            ) : (
                              <>
                                <FaUpload className="text-gray-400 text-2xl mb-2" />
                                <span className="text-sm text-gray-500">Upload RC Back</span>
                              </>
                            )}
                          </label>
                          {formik.touched.rcBackImage && formik.errors.rcBackImage && (
                            <p className="text-red-500 text-sm mt-1">{formik.errors.rcBackImage}</p>
                          )}
                        </div>
                      </div>

                      {/* RC Dates */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            <FaCalendarAlt className="mr-2 text-gray-500" />
                            RC Start Date
                          </label>
                          <input
                            className="w-full px-4 py-3 bg-white rounded-xl border-2 border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none transition-colors"
                            type="date"
                            name="rcStartDate"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.rcStartDate}
                          />
                          {formik.touched.rcStartDate && formik.errors.rcStartDate && (
                            <p className="text-red-500 text-sm mt-1">{formik.errors.rcStartDate}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            <FaCalendarAlt className="mr-2 text-gray-500" />
                            RC Expiry Date
                          </label>
                          <input
                            className="w-full px-4 py-3 bg-white rounded-xl border-2 border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none transition-colors"
                            type="date"
                            name="rcExpiryDate"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.rcExpiryDate}
                          />
                          {formik.touched.rcExpiryDate && formik.errors.rcExpiryDate && (
                            <p className="text-red-500 text-sm mt-1">{formik.errors.rcExpiryDate}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Images */}
                    <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                      <div className="flex items-center mb-4">
                        <FaCar className="text-yellow-600 text-2xl mr-3" />
                        <h3 className="text-xl font-bold text-gray-900">Vehicle Photos</h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Car Front */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Front View</label>
                          <input
                            type="file"
                            name="carFrontImage"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, "carFrontImage")}
                            className="hidden"
                            id="carFrontImage"
                          />
                          <label
                            htmlFor="carFrontImage"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-yellow-400 transition-colors bg-white"
                          >
                            {previews.carFrontImage ? (
                              <img src={previews.carFrontImage} alt="Car Front" className="h-full w-full object-contain rounded-xl" />
                            ) : (
                              <>
                                <FaUpload className="text-gray-400 text-2xl mb-2" />
                                <span className="text-sm text-gray-500">Upload Front View</span>
                              </>
                            )}
                          </label>
                          {formik.touched.carFrontImage && formik.errors.carFrontImage && (
                            <p className="text-red-500 text-sm mt-1">{formik.errors.carFrontImage}</p>
                          )}
                        </div>

                        {/* Car Side */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Side View</label>
                          <input
                            type="file"
                            name="carSideImage"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, "carSideImage")}
                            className="hidden"
                            id="carSideImage"
                          />
                          <label
                            htmlFor="carSideImage"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-yellow-400 transition-colors bg-white"
                          >
                            {previews.carSideImage ? (
                              <img src={previews.carSideImage} alt="Car Side" className="h-full w-full object-contain rounded-xl" />
                            ) : (
                              <>
                                <FaUpload className="text-gray-400 text-2xl mb-2" />
                                <span className="text-sm text-gray-500">Upload Side View</span>
                              </>
                            )}
                          </label>
                          {formik.touched.carSideImage && formik.errors.carSideImage && (
                            <p className="text-red-500 text-sm mt-1">{formik.errors.carSideImage}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={load}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {load ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Submitting...
                        </span>
                      ) : (
                        "Submit Vehicle Details"
                      )}
                    </button>
                  </form>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Vehicle;