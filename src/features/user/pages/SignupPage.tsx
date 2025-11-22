import { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { PinInput, PinInputField, HStack } from "@chakra-ui/react";
import {
  FaMobileAlt,
  FaUser,
  FaEnvelope,
  FaUsers,
  FaImage,
} from "react-icons/fa";
import { signupValidation } from "@/shared/utils/validation";
import UserApiEndpoints from "@/constants/user-api-end-pointes";
import { postData } from "@/shared/services/api/api-service";
import { ResponseCom } from "@/shared/types/common";
import { toast } from "@/shared/hooks/use-toast";
import { handleCustomError } from "@/shared/utils/error";

const Signup = () => {
  const [otpPage, setOtpPage] = useState(false);
  const [counter, setCounter] = useState(30);
  const [otp, setOtp] = useState<string>("");
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

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
      userImage: null,
    },
    validationSchema: signupValidation,
    onSubmit: async (values, { setSubmitting }) => {
      setLoading(true);
      try {
        console.log("Form submitted:", values);
        const res = await postData<ResponseCom["data"]>(
          UserApiEndpoints.CHECK_USER,
          values
        );

        if (res?.status === 201) {
          setOtpPage(true);
          toast({
            description: "OTP sent successfully. Check your email",
            variant: "success",
          });
        }
      } catch (error: unknown) {
        handleCustomError(error);
      } finally {
        setSubmitting(false);
        setLoading(false);
      }
    },
  });

  const handleOtpVerify = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    setLoading(true);

    if (otp.toString().length !== 6 || !otp) {
      toast({ description: "Enter a valid OTP", variant: "error" });
      setLoading(false);
      return;
    }

    try {
     const fd = new FormData();
    fd.append("name", formik.values.name);
    fd.append("email", formik.values.email);
    fd.append("mobile", formik.values.mobile);
    fd.append("referred_code", formik.values.referred_code ?? "");
    fd.append("otp",otp)
    if (formik.values.userImage) fd.append("userImage", formik.values.userImage);

const res = await postData<ResponseCom["data"]>(
  UserApiEndpoints.USER_REGISTER,
  fd
);
      if (res?.status === 201) {
        toast({
          description: "Registration successful login and start ride!",
          variant: "success",
        });
        navigate("/login");
      }
    } catch (error) {
      handleCustomError(error);
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {

    try {
      setLoading(true)
      const res = await postData(UserApiEndpoints.CHECK_USER, formik.values);
      if (res?.status == 201)
        setCounter(40);
        setOtp("");
        toast({ description: "OTP resent successfully", variant: "success" });
    } catch (error) {
      handleCustomError(error);
    }finally{
setLoading(false)
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      formik.setFieldValue("userImage", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/pick2me-bg.png')",
          filter: "brightness(0.7)",
        }}
      />

      <div className="absolute inset-0 bg-black/30" />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <div className="hidden lg:flex flex-col justify-center space-y-6 text-white">
            <h1 className="text-5xl xl:text-6xl font-bold leading-tight">
              Ride with <span className="text-yellow-400">pick2me</span>
            </h1>
            <div className="space-y-4 mt-8">
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-base">Safe and reliable rides</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gray-900"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-base">Affordable pricing</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gray-900"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-base">24/7 availability</span>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full">
            {otpPage ? (
              // OTP Form
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 max-w-md mx-auto">
                <div className="text-center mb-6">
                  <div className="inline-block bg-yellow-400 rounded-full p-3 mb-3">
                    <svg
                      className="w-8 h-8 text-gray-900"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Verify OTP
                  </h2>
                  <p className="text-sm text-gray-600">
                    Enter the 6-digit code sent to your email
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
                    disabled={loading}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin h-5 w-5 mr-3"
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
                        Verifying...
                      </span>
                    ) : (
                      "Verify OTP"
                    )}
                  </button>

                  <div className="text-center">
                    {counter > 0 ? (
                      <p className="text-sm text-gray-600">
                        Resend OTP in{" "}
                        <span className="font-semibold text-gray-900">
                          00:{counter < 10 ? `0${counter}` : counter}
                        </span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        className="text-sm text-yellow-600 hover:text-yellow-700 font-semibold underline"
                        onClick={async () => resendOtp()}
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </form>
              </div>
            ) : (
              // Registration Form
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 max-w-md mx-auto">
                <div className="text-center mb-6 lg:hidden">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Join <span className="text-yellow-600">pick2me</span>
                  </h2>
                  <p className="text-sm text-gray-600">
                    Create your account to get started
                  </p>
                </div>

                <div className="hidden lg:block text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Create Your Account
                  </h2>
                  <p className="text-sm text-gray-600">
                    Fill in your details to get started
                  </p>
                </div>

                <form onSubmit={formik.handleSubmit} className="space-y-4">
                  {/* Profile Image Upload */}
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <input
                        type="file"
                        id="userImage"
                        name="userImage"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="userImage"
                        className="cursor-pointer block"
                      >
                        <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 hover:border-yellow-400 transition-colors flex items-center justify-center overflow-hidden">
                          {userImageUrl ? (
                            <img
                              src={userImageUrl}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center">
                              <FaImage className="text-gray-400 text-2xl mx-auto mb-1" />
                              <span className="text-xs text-gray-500">
                                Upload Photo
                              </span>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Name Field */}
                  <div>
                    <div
                      className={`flex items-center bg-gray-50 rounded-lg px-3 py-2.5 border-2 transition-colors ${
                        formik.touched.name && formik.errors.name
                          ? "border-red-400"
                          : "border-transparent focus-within:border-yellow-400"
                      }`}
                    >
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
                      <p className="text-red-500 text-xs mt-1 ml-1">
                        {formik.errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <div
                      className={`flex items-center bg-gray-50 rounded-lg px-3 py-2.5 border-2 transition-colors ${
                        formik.touched.email && formik.errors.email
                          ? "border-red-400"
                          : "border-transparent focus-within:border-yellow-400"
                      }`}
                    >
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
                      <p className="text-red-500 text-xs mt-1 ml-1">
                        {formik.errors.email}
                      </p>
                    )}
                  </div>

                  {/* Mobile Field */}
                  <div>
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
                        value={formik.values.mobile}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Mobile Number"
                      />
                    </div>
                    {formik.touched.mobile && formik.errors.mobile && (
                      <p className="text-red-500 text-xs mt-1 ml-1">
                        {formik.errors.mobile}
                      </p>
                    )}
                  </div>

                  {/* Referral Code Field */}
                  <div>
                    <div
                      className={`flex items-center bg-gray-50 rounded-lg px-3 py-2.5 border-2 transition-colors ${
                        formik.touched.referred_code &&
                        formik.errors.referred_code
                          ? "border-red-400"
                          : "border-transparent focus-within:border-yellow-400"
                      }`}
                    >
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
                    {formik.touched.referred_code &&
                      formik.errors.referred_code && (
                        <p className="text-red-500 text-xs mt-1 ml-1">
                          {formik.errors.referred_code}
                        </p>
                      )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-5"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin h-5 w-5 mr-3"
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
                        onClick={() => navigate("/login")}
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
    </div>
  );
};

export default Signup;
