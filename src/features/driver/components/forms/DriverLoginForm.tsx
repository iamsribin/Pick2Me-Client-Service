import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { GoogleLogin } from "@react-oauth/google";
import { PinInput, PinInputField, HStack } from "@chakra-ui/react";
import { FaMobileAlt, FaSignInAlt } from "react-icons/fa";
import { sendOtp } from "@/shared/hooks/useAuth";
import { postData } from "@/shared/services/api/api-service";
import DriverApiEndpoints from "@/constants/driver-api-end-pontes";
import { StatusCode } from "@/shared/types/enum";
import { setItem } from "@/shared/utils/localStorage";
import { userLogin } from "@/shared/services/redux/slices/userSlice";
import { useDispatch } from "react-redux";
import { toast } from "@/shared/hooks/use-toast";
import { handleCustomError } from "@/shared/utils/error";
import { ResponseCom } from "@/shared/types/common";

interface DriverLoginFormProps {
  auth: any;
  otpInput: boolean;
  setOtpInput: (value: boolean) => void;
  otp: number;
  setOtp: (value: number) => void;
  load: boolean;
  setLoad: (value: boolean) => void;
  counter: number;
  setCounter: (value: number) => void;
  confirmationResult: any;
  setConfirmationResult: (value: any) => void;
  driverData: any;
  setDriverData: (value: any) => void;
  onGoogleLogin: (response: any) => void;
  setRejectModal: (value: boolean) => void;
  setPendingModal: (value: boolean) => void;
}

const DriverLoginForm = ({
  auth,
  otpInput,
  setOtpInput,
  otp,
  setOtp,
  load,
  setLoad,
  counter,
  setCounter,
  confirmationResult,
  setConfirmationResult,
  driverData,
  setDriverData,
  onGoogleLogin,
  setRejectModal,
  setPendingModal
}: DriverLoginFormProps) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (otpInput && counter > 0) {
      const timer = setTimeout(() => setCounter(counter - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [counter, otpInput, setCounter]);

  const formik = useFormik({
    initialValues: {
      mobile: "",
    },
    validationSchema: Yup.object({
      mobile: Yup.string()
        .matches(/^[0-9]{10}$/, "Mobile number must be 10 digits")
        .required("Mobile number is required"),
    }),
    onSubmit: async (values) => {
      setLoad(true);
      try {
        const response = await postData<ResponseCom["data"]>(
          DriverApiEndpoints.CHECK_LOGIN_NUMBER,
          values
        );
        
        const data = response?.data;
        if (data && response?.status === StatusCode.OK) {
          if (response.status == 200 && data.message === "Success") {
            await sendOtp(setOtp, auth, values.mobile, setConfirmationResult,setOtpInput);
          } else if (data.message === "Pending") {
            setPendingModal(true);
          } else if (data.message === "Rejected") {
            setItem("role", "Resubmission");
            setItem("driverId", data.driverId);
            setRejectModal(true);
          } else if (data.message === "Blocked") {
            toast({ description: "Your account is blocked!", variant: "error" });
          }
        } else if (data.status === StatusCode.Accepted) {
          toast({
            description: `Please complete your ${data.nextStep}`,
            variant: "info",
          });
          setItem("driverId", data.driverId || "");
          navigate("/driver/signup");
        }
      } catch (error) {
        handleCustomError(error);
      } finally {
        setLoad(false);
      }
    },
  });

  const handleOtpVerify = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setLoad(true);

    if (otp.toString().length !== 6 || !otp || !confirmationResult) {
      toast({ description: "Enter a valid OTP", variant: "error" });
      setLoad(false);
      return;
    }

    try {
      await confirmationResult.confirm(otp.toString());
      await loginDriver();
    } catch (err) {
      console.log(err);
      toast({ description: "Invalid OTP", variant: "error" });
      setLoad(false);
    }
  };

  const loginDriver = async () => {
    try {
      const response = await postData<ResponseCom["data"]>(DriverApiEndpoints.CHECK_LOGIN_NUMBER, {
        mobile: formik.values.mobile,
      });
      const data = response?.data;
      if (data && data.message === "Success"&& response?.status === StatusCode.OK) {
        toast({ description: "Login successful!", variant: "success" });
        dispatch(
          userLogin({
            name: data.name,
            id: data.id,
            role: "Driver",
          })
        );
        navigate("/driver/dashboard");
      }
    } catch (error) {
      handleCustomError(error);
    } finally {
      setLoad(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 z-0">
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
          {/* Left Side - Branding  */}
          <div className="hidden lg:flex flex-col justify-center space-y-6 text-white">
            {otpInput ? (
              <>
                <h1 className="text-5xl xl:text-6xl font-bold leading-tight">
                  Secure <span className="text-yellow-400">Login</span>
                </h1>
                <p className="text-xl text-gray-200">
                  Enter the OTP sent to your registered mobile number
                </p>
                <div className="space-y-4 mt-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <span className="text-lg">Secure OTP verification</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <span className="text-lg">Protected account access</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-lg">Quick authentication</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-5xl xl:text-6xl font-bold leading-tight">
                  Welcome to <span className="text-yellow-400">pick2me</span>
                </h1>
                <p className="text-xl text-gray-200">
                  Sign in to start your journey as a driver
                </p>
                <div className="space-y-4 mt-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-lg">Earn on your schedule</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <span className="text-lg">Connect with riders</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <span className="text-lg">Safe and secure platform</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Side - Login Form*/}
          <div className="w-full">
            {otpInput ? (
              // OTP Verification Form
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 max-w-md mx-auto">
                <div className="text-center mb-6">
                  <div className="inline-block bg-yellow-400 rounded-full p-3 mb-3">
                    <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Verify OTP</h2>
                  <p className="text-sm text-gray-600">Enter the 6-digit code sent to {formik.values.mobile}</p>
                </div>

                <form className="space-y-5">
                  <div className="flex justify-center">
                    <HStack spacing={2}>
                      <PinInput
                        otp
                        placeholder=""
                        value={otp.toString()}
                        onChange={(value) => setOtp(parseInt(value) || 0)}
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
                    type="button"
                    disabled={counter <= 0 || load}
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
                      "Verify & Login"
                    )}
                  </button>

                  <div className="text-center">
                   {counter > 0 ? (
  <p className="text-sm text-gray-600">
    Resend OTP in <span className="font-semibold text-gray-900">
      00:{counter < 10 ? `0${counter}` : counter}
    </span>
  </p>
) : (
  <button
    type="button"
    disabled={counter > 0 || load}
    onClick={() => {
      setCounter(40);
      sendOtp(setOtp, auth, formik.values.mobile, setConfirmationResult, setOtpInput);
    }}
    className="text-sm text-yellow-600 hover:text-yellow-700 font-semibold underline disabled:opacity-50 disabled:cursor-not-allowed"
  >
    Resend OTP
  </button>
)}

                  </div>

                  <button
                    type="button"
                    onClick={() => setOtpInput(false)}
                    className="w-full text-gray-600 hover:text-gray-800 font-semibold underline"
                  >
                    Change Mobile Number
                  </button>
                </form>
              </div>
            ) : (
              // Mobile Number Login Form -
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 max-w-md mx-auto">
                <div className="text-center mb-6 lg:hidden">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Driver <span className="text-yellow-600">Login</span></h2>
                  <p className="text-sm text-gray-600">Sign in to your account</p>
                </div>

                <div className="hidden lg:block text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign In</h2>
                  <p className="text-sm text-gray-600">Access your driver account</p>
                </div>

                <form onSubmit={formik.handleSubmit} className="space-y-4">
                  {/* Mobile Number Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                    <div
                      className={`flex items-center bg-gray-50 rounded-lg px-3 py-2.5 border-2 transition-colors ${
                        formik.touched.mobile && formik.errors.mobile
                          ? "border-red-400"
                          : "border-transparent focus-within:border-yellow-400"
                      }`}
                    >
                      <FaMobileAlt className="text-gray-400 mr-2 text-sm" />
                      <input
                        className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-400 text-sm"
                        type="tel"
                        name="mobile"
                        placeholder="Enter 10-digit mobile number"
                        value={formik.values.mobile}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                    </div>
                    {formik.touched.mobile && formik.errors.mobile && (
                      <p className="text-red-500 text-xs mt-1 ml-1">{formik.errors.mobile}</p>
                    )}
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={load}
                    className="w-full flex items-center justify-center space-x-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {load ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <FaSignInAlt />
                        <span>Continue with OTP</span>
                      </>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
                    </div>
                  </div>

                  {/* Google Login */}
                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={onGoogleLogin}
                      onError={() => {
                        toast({ description: "Google login failed", variant: "error" });
                      }}
                      useOneTap
                      theme="outline"
                      size="large"
                      text="signin_with"
                      shape="rectangular"
                    />
                  </div>

                  {/* Sign Up Link */}
                  <div className="text-center pt-3">
                    <span className="text-gray-600 text-xs">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => navigate("/driver/signup")}
                        className="text-yellow-600 hover:text-yellow-700 font-semibold underline"
                      >
                        Register now
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

export default DriverLoginForm;
