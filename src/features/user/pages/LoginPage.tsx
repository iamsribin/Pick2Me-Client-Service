import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useState } from "react";
import { ConfirmationResult } from "firebase/auth";
import { CredentialResponse } from "@react-oauth/google";
import LoginForm from "../components/forms/LoginForm";
import { auth } from "@/shared/services/firebase";
import { jwtDecode } from "jwt-decode";
import { DecodedToken } from "../components/forms/type";
import { UserAuthData } from "@/shared/types/user/userTypes";
import { postData } from "@/shared/services/api/api-service";
import { ResponseCom } from "@/shared/types/common";
import { userLogin } from "@/shared/services/redux/slices/userSlice";
import { toast } from "@/shared/hooks/use-toast";
import { handleCustomError } from "@/shared/utils/error";
import UserApiEndpoints from "@/constants/user-api-end-pointes";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [userData, setUserData] = useState<UserAuthData>({
    user: "",
    user_id: "",
    userToken: "",
    loggedIn: false,
    role: "User",
    mobile: undefined,
    profile: "",
  });
  const [otpInput, setOtpInput] = useState(false);
  const [otp, setOtp] = useState<number>(0);
  const [counter, setCounter] = useState(40);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async (data: CredentialResponse) => {
    try {
      const token = data.credential;
      if (!token) throw new Error("No credential provided");
      const decode = jwtDecode<DecodedToken>(token);
      setLoading(true);

      const response = await postData<ResponseCom["data"]>(
        UserApiEndpoints.CHECK_GOOGLE_LOGIN,
        { email: decode.email }
      );

      const res = response?.data;
      console.log("res",res);

      if (response?.status == 200 &&res.message === "Authentication successful") {
        const role = res.role as "User" | "Admin";
        toast({description:"Login Success", variant: "success"});
        // authService.set(res.token)
        localStorage.setItem("token",res.token)
        dispatch(
          userLogin({ name: res.name, role, id: res._id })
        );
        if (role === "Admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/");
        }

      } else if (res.message === "Blocked") {
        toast({description:"Your account is blocked", variant: "success"});
      } else {
        toast({description:"Your account is blocked"});
      }
    } catch (err) {
      handleCustomError(err)
    } finally {
      setLoading(false);
    }
  };

  return (
        <>
        <LoginForm
          auth={auth}
          otpInput={otpInput}
          setOtpInput={setOtpInput}
          otp={otp}
          setOtp={setOtp}
          counter={counter}
          setCounter={setCounter}
          confirmationResult={confirmationResult}
          setConfirmationResult={setConfirmationResult}
          userData={userData}
          setUserData={setUserData}
          onGoogleLogin={handleGoogleLogin}
          setLoading={setLoading}
          loading={loading}
        />
      <div id="recaptcha-container" />
      </>
  );
};

export default Login;
