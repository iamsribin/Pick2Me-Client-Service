import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { PinInput, PinInputField, HStack } from "@chakra-ui/react";
import {
  FaMobileAlt,
  FaUser,
  FaEnvelope,
  FaUsers,
} from "react-icons/fa";
import { sendOtp } from "@/shared/hooks/useAuth";
import { signupValidation } from "@/shared/utils/validation";
import DriverApiEndpoints from "@/constants/driver-api-end-pontes";
import { Res_checkRegisterDriver } from "./type";
import { postData } from "@/shared/services/api/api-service";
import { StatusCode } from "@/shared/types/enum";
import { setItem } from "@/shared/utils/localStorage";
import { auth } from "@/shared/services/firebase";
import { ResponseCom } from "@/shared/types/common";
import { toast } from "@/shared/hooks/use-toast";
import { handleCustomError } from "@/shared/utils/error";

const DriverSignupForm = ({
  otpPage,
  setOtpPage,
  counter,
  setCounter,
  load,
  setLoad,
  otp,
  setOtp,
  confirmationResult,
  setConfirmationResult,
  setStep,
}: any) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (otpPage && counter > 0) {
      const timer = setTimeout(() => setCounter(counter - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [counter, otpPage, setCounter]);

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      mobile: "",
      password: "",
      re_password: "",
      referred_code: "",
    },
    validationSchema: signupValidation,
    onSubmit: async (values, { setSubmitting }) => {
      setLoad(true);
      try {
        console.log("Form submitted:", values);
         const res = await postData<Res_checkRegisterDriver>(
        DriverApiEndpoints.CHECK_REGISTER_DRIVER,
        values
      );

       const data = res?.data

      if (data?.status === StatusCode.Accepted && data?.nextStep) {
        toast({description:`Driver Already registered!\n Please submit your ${data.nextStep}`});
        setItem("driverId", data.driverId || "");
        setItem("currentStep", data.nextStep);
        setStep(data.nextStep);
        return;
      }

      if (res &&res.status === StatusCode.OK && data?.isFullyRegistered) {
        toast({description:"Already registered. Please log in."});
        return;
      }

      // New registration
      if (data?.status === StatusCode.OK) {
        sendOtp(setOtp, auth, values.mobile, setConfirmationResult,setOtpPage);
        
        return;
      }

      } catch (error:unknown) {
        handleCustomError(error);
      } finally {
        setSubmitting(false);
        setLoad(false);
      }
    },
  });

  const handleOtpVerify = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    setLoad(true);
    
    if (otp.toString().length !== 6 || !otp || !confirmationResult) {
      toast({description:"Enter a valid OTP",variant: "error"});
      setLoad(false);
      return;
    }

    try {
      await confirmationResult.confirm(otp.toString());
      await registerDriver();
    } catch (err) {
      console.log(err);
      toast({description:"Enter a valid OTP", variant: "error"});
      setLoad(false);
    }
  };

  const registerDriver = async () => {
    try {

      const  res  = await postData<ResponseCom["data"]>(
        DriverApiEndpoints.DRIVER_REGISTER,
        formik.values
      );

      const data = res?.data;
      if (data.message === "Success") {
        toast({description:"OTP verified successfully",variant: "success"});
        setItem("driverId", data.id);
        setItem("currentStep", "documents");
        setStep("documents");
      }
    } catch (error) {
      handleCustomError(error);
    } finally {
      setLoad(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4">
      {/* Background Image with Improved Visibility */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/pick2me-bg.png')",
          filter: "brightness(0.7)",
        }}
      />
      
      {/* Lighter overlay for better image visibility */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <div className="hidden lg:flex flex-col justify-center space-y-6 text-white">
            <h1 className="text-5xl xl:text-6xl font-bold leading-tight">
              Drive with <span className="text-yellow-400">pick2me</span>
            </h1>
            {/* <p className="text-lg text-gray-100">
              Join thousands of drivers earning on their own schedule
            </p> */}
            <div className="space-y-4 mt-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-base">Flexible working hours</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-base">Competitive earnings</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-base">24/7 support</span>
              </div>
            </div>
          </div>

          {/* Right Side - Compact Form */}
          <div className="w-full">
            {otpPage ? (
              // OTP Form - Compact
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 max-w-md mx-auto">
                <div className="text-center mb-6">
                  <div className="inline-block bg-yellow-400 rounded-full p-3 mb-3">
                    <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Verify OTP
                  </h2>
                  <p className="text-sm text-gray-600">
                    Enter the 6-digit code sent to your mobile
                  </p>
                </div>

                <form className="space-y-5">
                  <div className="flex justify-center">
                    <HStack spacing={2}>
                      <PinInput 
                        otp 
                        placeholder=""
                        value={otp}
                        onChange={(value) => setOtp(value)}
                        size="md"
                      >
                        {[...Array(6)].map((_, index) => (
                          <PinInputField 
                            key={index}
                            className="!w-10 !h-10 !text-lg !border-2 !border-gray-300 !rounded-lg focus:!border-yellow-400 focus:!ring-2 focus:!ring-yellow-200"
                          />
                        ))}
                      </PinInput>
                    </HStack>
                  </div>

                  <button
                    onClick={handleOtpVerify}
                    type="submit"
                    disabled={load}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {load ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Verifying...
                      </span>
                    ) : (
                      "Verify OTP"
                    )}
                  </button>

                  <div className="text-center">
                    {counter > 0 ? (
                      <p className="text-sm text-gray-600">
                        Resend OTP in <span className="font-semibold text-gray-900">00:{counter < 10 ? `0${counter}` : counter}</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        className="text-sm text-yellow-600 hover:text-yellow-700 font-semibold underline"
                        onClick={() => {
                          setCounter(40);
                          setOtp("");
                          sendOtp(setOtp, null, formik.values.mobile, setConfirmationResult,setOtpPage);
                        }}
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </form>
              </div>
            ) : (
              // Registration Form - Compact
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 max-w-md mx-auto">
                <div className="text-center mb-6 lg:hidden">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Join <span className="text-yellow-600">pick2me</span>
                  </h2>
                  <p className="text-sm text-gray-600">Start earning today as a driver</p>
                </div>

                <div className="hidden lg:block text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Create Your Account
                  </h2>
                  <p className="text-sm text-gray-600">Fill in your details to get started</p>
                </div>

                <form onSubmit={formik.handleSubmit} className="space-y-4">
                  {/* Name Field */}
                  <div>
                    <div className={`flex items-center bg-gray-50 rounded-lg px-3 py-2.5 border-2 transition-colors ${
                      formik.touched.name && formik.errors.name
                        ? "border-red-400"
                        : "border-transparent focus-within:border-yellow-400"
                    }`}>
                      <FaUser className="text-gray-400 mr-2 text-sm" />
                      <input
                        className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-400 text-sm"
                        type="text"
                        name="name"
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Full Name"
                      />
                    </div>
                    {formik.touched.name && formik.errors.name && (
                      <p className="text-red-500 text-xs mt-1 ml-1">{formik.errors.name}</p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <div className={`flex items-center bg-gray-50 rounded-lg px-3 py-2.5 border-2 transition-colors ${
                      formik.touched.email && formik.errors.email
                        ? "border-red-400"
                        : "border-transparent focus-within:border-yellow-400"
                    }`}>
                      <FaEnvelope className="text-gray-400 mr-2 text-sm" />
                      <input
                        className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-400 text-sm"
                        type="email"
                        name="email"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Email Address"
                      />
                    </div>
                    {formik.touched.email && formik.errors.email && (
                      <p className="text-red-500 text-xs mt-1 ml-1">{formik.errors.email}</p>
                    )}
                  </div>

                  {/* Mobile Field */}
                  <div>
                    <div className={`flex items-center bg-gray-50 rounded-lg px-3 py-2.5 border-2 transition-colors ${
                      formik.touched.mobile && formik.errors.mobile
                        ? "border-red-400"
                        : "border-transparent focus-within:border-yellow-400"
                    }`}>
                      <FaMobileAlt className="text-gray-400 mr-2 text-sm" />
                      <input
                        className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-400 text-sm"
                        type="tel"
                        name="mobile"
                        value={formik.values.mobile}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Mobile Number"
                      />
                    </div>
                    {formik.touched.mobile && formik.errors.mobile && (
                      <p className="text-red-500 text-xs mt-1 ml-1">{formik.errors.mobile}</p>
                    )}
                  </div>

                  {/* Referral Code Field */}
                  <div>
                    <div className={`flex items-center bg-gray-50 rounded-lg px-3 py-2.5 border-2 transition-colors ${
                      formik.touched.referred_code && formik.errors.referred_code
                        ? "border-red-400"
                        : "border-transparent focus-within:border-yellow-400"
                    }`}>
                      <FaUsers className="text-gray-400 mr-2 text-sm" />
                      <input
                        className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-400 text-sm"
                        type="text"
                        name="referred_code"
                        value={formik.values.referred_code}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Referral Code (Optional)"
                      />
                    </div>
                    {formik.touched.referred_code && formik.errors.referred_code && (
                      <p className="text-red-500 text-xs mt-1 ml-1">{formik.errors.referred_code}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={load}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-5"
                  >
                    {load ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      "Register Now"
                    )}
                  </button>

                  <div className="text-center pt-3">
                    <span className="text-gray-600 text-xs">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => navigate("/driver/login")}
                        className="text-yellow-600 hover:text-yellow-700 font-semibold underline"
                      >
                        Login here
                      </button>
                    </span>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recaptcha Container */}
      <div id="recaptcha-container" />
    </div>
  );
};

export default DriverSignupForm;