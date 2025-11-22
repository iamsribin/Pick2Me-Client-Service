import { useState } from "react";
import { useFormik } from "formik";
import DriverPhotoPage from "./DriverPhoto";
import { Player } from "@lottiefiles/react-lottie-player";
import { DriverIdentificationValidation } from "@/shared/utils/validation";
import { postData } from "@/shared/services/api/api-service";
import { ResponseCom } from "@/shared/types/common";
import DriverApiEndpoints from "@/constants/driver-api-end-pontes";
import { FaIdCard, FaCalendarAlt, FaUpload } from "react-icons/fa";
import { handleCustomError } from "@/shared/utils/error";
import { toast } from "@/shared/hooks/use-toast";
import { removeItem } from "@/shared/utils/localStorage";
import { useNavigate } from "react-router-dom";

function DriverIdentification() {
  const [photoPage, setPhotoPage] = useState(false);
  const [load, setLoad] = useState(false);
  const navigate = useNavigate();
  const [previews, setPreviews] = useState({
    aadharFront: null,
    aadharBack: null,
    licenseFront: null,
    licenseBack: null,
  });

  const initialValues = {
    aadharID: "",
    aadharFrontImage: null,
    aadharBackImage: null,
    licenseID: "",
    licenseFrontImage: null,
    licenseBackImage: null,
    licenseValidity: "",
  };

  const formik = useFormik({
    initialValues,
    validationSchema: DriverIdentificationValidation,
    onSubmit: async (values) => {
      const formData = new FormData();

      formData.append("aadharID", values.aadharID);
      if (values.aadharFrontImage) {
        formData.append("aadharFrontImage", values.aadharFrontImage);
      }
      if (values.aadharBackImage) {
        formData.append("aadharBackImage", values.aadharBackImage);
      }

      formData.append("licenseID", values.licenseID);
      if (values.licenseFrontImage) {
        formData.append("licenseFrontImage", values.licenseFrontImage);
      }
      if (values.licenseBackImage) {
        formData.append("licenseBackImage", values.licenseBackImage);
      }

      formData.append("licenseValidity", values.licenseValidity);

      handleUpload(formData);
    },
  });

  const handleUpload = async (formData: FormData) => {
    try {
      const driverId = localStorage.getItem("driverId");
      if (!driverId) {
         toast({description: "id not found signup again", variant: "error"});
         removeItem("currentStep");
         navigate("/driver/signup")
        return;
      }
       setLoad(true);
       const res =  await postData<ResponseCom>(
        `${DriverApiEndpoints.DRIVER_IDENTIFICATION}?driverId=${driverId}`,
        formData
      );
      if(res?.status == 200){
        setPhotoPage(true);
        toast({description:"Identification details submitted successfully"});
      }
    } catch (error: any) {
      handleCustomError(error);
    } finally {
      setLoad(false);
    }
  };

  const handleFileInput = (
    fieldName: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageChange(fieldName, file);
    }
  };

  const handleImageChange = (fieldName: string, file: File) => {
    formik.setFieldValue(fieldName, file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreviews((prev) => ({
        ...prev,
        [fieldName.replace("Image", "")]: previewUrl,
      }));
    }
  };

  return (
    <>
      {photoPage ? (
        <DriverPhotoPage />
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
              {/* Left Side - Branding & Animation */}
              <div className="hidden lg:flex flex-col justify-center space-y-6 text-white">
                <h1 className="text-5xl xl:text-6xl font-bold leading-tight">
                  Verify Your <span className="text-yellow-400">Identity</span>
                </h1>
                <p className="text-xl text-gray-200">
                  We need to verify your documents to ensure safety for everyone
                </p>

                {/* Animation */}
                <div>
                  { (
                    <Player
                      autoplay
                      loop
                      src="https://lottie.host/4d9f98cb-2a44-4a20-b422-649992c60069/MTxuwxSyrs.json"
                      style={{
                        height: "350px",
                        width: "100%",
                        background: "transparent",
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Right Side - Form */}
              <div className="w-full">
                <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-10 max-h-[85vh] overflow-y-scroll scrollbar-hide">
                  {/* Mobile Header */}
                  <div className="text-center mb-8 lg:hidden">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      Identification <span className="text-yellow-600">Documents</span>
                    </h2>
                    <p className="text-gray-600">Upload your Aadhaar and Driving License</p>
                  </div>

                  {/* Desktop Header */}
                  <div className="hidden lg:block text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      Document Verification
                    </h2>
                    <p className="text-gray-600">Please provide clear images of your documents</p>
                  </div>

                  <form onSubmit={formik.handleSubmit} className="space-y-6">
                    {/* Aadhaar Section */}
                    <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                      <div className="flex items-center mb-4">
                        <FaIdCard className="text-yellow-600 text-2xl mr-3" />
                        <h3 className="text-xl font-bold text-gray-900">Aadhaar Card</h3>
                      </div>

                      {/* Aadhaar ID Input */}
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Aadhaar Number
                        </label>
                        <input
                          className="w-full px-4 py-3 bg-white rounded-xl border-2 border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none transition-colors"
                          type="text"
                          name="aadharID"
                          placeholder="Enter 12-digit Aadhaar number"
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          value={formik.values.aadharID}
                        />
                        {formik.touched.aadharID && formik.errors.aadharID && (
                          <p className="text-red-500 text-sm mt-1">{formik.errors.aadharID}</p>
                        )}
                      </div>

                      {/* Aadhaar Images */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Front Image */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Front Side
                          </label>
                          <div className="relative">
                            <input
                              type="file"
                              name="aadharFrontImage"
                              accept="image/*"
                              onChange={(e) => handleFileInput("aadharFrontImage", e)}
                              className="hidden"
                              id="aadharFrontImage"
                            />
                            <label
                              htmlFor="aadharFrontImage"
                              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-yellow-400 transition-colors bg-white"
                            >
                              {previews.aadharFront ? (
                                <img
                                  src={previews.aadharFront}
                                  alt="Aadhaar Front"
                                  className="h-full w-full object-contain rounded-xl"
                                />
                              ) : (
                                <>
                                  <FaUpload className="text-gray-400 text-2xl mb-2" />
                                  <span className="text-sm text-gray-500">Upload Front</span>
                                </>
                              )}
                            </label>
                          </div>
                          {formik.touched.aadharFrontImage && formik.errors.aadharFrontImage && (
                            <p className="text-red-500 text-sm mt-1">{formik.errors.aadharFrontImage}</p>
                          )}
                        </div>

                        {/* Back Image */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Back Side
                          </label>
                          <div className="relative">
                            <input
                              type="file"
                              name="aadharBackImage"
                              accept="image/*"
                              onChange={(e) => handleFileInput("aadharBackImage", e)}
                              className="hidden"
                              id="aadharBackImage"
                            />
                            <label
                              htmlFor="aadharBackImage"
                              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-yellow-400 transition-colors bg-white"
                            >
                              {previews.aadharBack ? (
                                <img
                                  src={previews.aadharBack}
                                  alt="Aadhaar Back"
                                  className="h-full w-full object-contain rounded-xl"
                                />
                              ) : (
                                <>
                                  <FaUpload className="text-gray-400 text-2xl mb-2" />
                                  <span className="text-sm text-gray-500">Upload Back</span>
                                </>
                              )}
                            </label>
                          </div>
                          {formik.touched.aadharBackImage && formik.errors.aadharBackImage && (
                            <p className="text-red-500 text-sm mt-1">{formik.errors.aadharBackImage}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Driving License Section */}
                    <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                      <div className="flex items-center mb-4">
                        <FaIdCard className="text-yellow-600 text-2xl mr-3" />
                        <h3 className="text-xl font-bold text-gray-900">Driving License</h3>
                      </div>

                      {/* License ID Input */}
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          License Number
                        </label>
                        <input
                          className="w-full px-4 py-3 bg-white rounded-xl border-2 border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none transition-colors"
                          type="text"
                          name="licenseID"
                          placeholder="Enter your license number"
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          value={formik.values.licenseID}
                        />
                        {formik.touched.licenseID && formik.errors.licenseID && (
                          <p className="text-red-500 text-sm mt-1">{formik.errors.licenseID}</p>
                        )}
                      </div>

                      {/* License Images */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        {/* Front Image */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Front Side
                          </label>
                          <div className="relative">
                            <input
                              type="file"
                              name="licenseFrontImage"
                              accept="image/*"
                              onChange={(e) => handleFileInput("licenseFrontImage", e)}
                              className="hidden"
                              id="licenseFrontImage"
                            />
                            <label
                              htmlFor="licenseFrontImage"
                              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-yellow-400 transition-colors bg-white"
                            >
                              {previews.licenseFront ? (
                                <img
                                  src={previews.licenseFront}
                                  alt="License Front"
                                  className="h-full w-full object-contain rounded-xl"
                                />
                              ) : (
                                <>
                                  <FaUpload className="text-gray-400 text-2xl mb-2" />
                                  <span className="text-sm text-gray-500">Upload Front</span>
                                </>
                              )}
                            </label>
                          </div>
                          {formik.touched.licenseFrontImage && formik.errors.licenseFrontImage && (
                            <p className="text-red-500 text-sm mt-1">{formik.errors.licenseFrontImage}</p>
                          )}
                        </div>

                        {/* Back Image */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Back Side
                          </label>
                          <div className="relative">
                            <input
                              type="file"
                              name="licenseBackImage"
                              accept="image/*"
                              onChange={(e) => handleFileInput("licenseBackImage", e)}
                              className="hidden"
                              id="licenseBackImage"
                            />
                            <label
                              htmlFor="licenseBackImage"
                              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-yellow-400 transition-colors bg-white"
                            >
                              {previews.licenseBack ? (
                                <img
                                  src={previews.licenseBack}
                                  alt="License Back"
                                  className="h-full w-full object-contain rounded-xl"
                                />
                              ) : (
                                <>
                                  <FaUpload className="text-gray-400 text-2xl mb-2" />
                                  <span className="text-sm text-gray-500">Upload Back</span>
                                </>
                              )}
                            </label>
                          </div>
                          {formik.touched.licenseBackImage && formik.errors.licenseBackImage && (
                            <p className="text-red-500 text-sm mt-1">{formik.errors.licenseBackImage}</p>
                          )}
                        </div>
                      </div>

                      {/* License Validity Date */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                          <FaCalendarAlt className="mr-2 text-gray-500" />
                          Validity Date
                        </label>
                        <input
                          className="w-full px-4 py-3 bg-white rounded-xl border-2 border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none transition-colors"
                          type="date"
                          name="licenseValidity"
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          value={formik.values.licenseValidity}
                        />
                        {formik.touched.licenseValidity && formik.errors.licenseValidity && (
                          <p className="text-red-500 text-sm mt-1">{formik.errors.licenseValidity}</p>
                        )}
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
                        "Submit Documents"
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

export default DriverIdentification;