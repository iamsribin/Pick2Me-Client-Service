import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ConfirmationResult } from "firebase/auth";
import { CredentialResponse } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import DriverLoginForm from "@/features/driver/components/forms/DriverLoginForm";
import { auth } from "@/shared/services/firebase";
import { useDispatch } from "react-redux";
import { DriverAuthData } from "@/shared/types/driver/driver-type";
import PendingModal from "@/shared/components/PendingModal";
import RejectedModal from "@/shared/components/RejectModal";
import { postData } from "@/shared/services/api/api-service";
import DriverApiEndpoints from "@/constants/driver-api-end-pontes";
import { ResponseCom } from "@/shared/types/common";
import { StatusCode } from "@/shared/types/enum";
import { setItem } from "@/shared/utils/localStorage";
import { userLogin } from "@/shared/services/redux/slices/userSlice";
import { toast } from "@/shared/hooks/use-toast";
import { handleCustomError } from "@/shared/utils/error";

interface DecodedToken {
  email: string;
}

const DriverLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [otpInput, setOtpInput] = useState(false);
  const [otp, setOtp] = useState<number>(0);
  const [load, setLoad] = useState(false);
  const [counter, setCounter] = useState(40);
  const [pendingModal, setPendingModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const [driverData, setDriverData] = useState<DriverAuthData>({
    name: "",
    token: "",
    driverId: "",
    role: "Driver",
  });
  
const location = useLocation();

useEffect(() => {
  if (location.state?.showPendingModal) {
    setPendingModal(true);
    window.history.replaceState({}, document.title); 
  }
}, [location.state]);

  const handleGoogleLogin = async (req: CredentialResponse) => {
    const token = req.credential;
    if (!token) throw new Error("No credential provided");
    const decode = jwtDecode<DecodedToken>(token);
    try {
      const res = await postData<ResponseCom["data"]>(
        DriverApiEndpoints.GOOGLE_LOGIN,
        {
          email: decode.email,
        }
      );

      const data = res?.data;
      if (data?.status == StatusCode.OK) {
        console.log("data",data);
        
        switch (data.message) {
          case "Success":
            toast({ description: "Successfully logged in!", variant: "success" });
            dispatch(
              userLogin({
                name: data.name,
                id: data.id,
                role: "Driver",
              })
            );
            navigate("/driver/dashboard");
            break;
          case "Incomplete registration":
            toast({ description: "Please complete the registration!", variant: "info" });
            navigate("/driver/signup");
            break;
          case "Blocked":
            toast({ description: "Your account is blocked!", variant: "error" });
            break;
          case "Pending":
            setPendingModal(true);
            break;
          case "Rejected":
            setItem("role", "Resubmission");
            setItem("driverId", data.id);
            setRejectModal(true);
            break;
          default:
            toast({ description: "Not registered! Please register to continue.", variant: "error" });
        }
      }
    } catch (error) {
      handleCustomError(error);
    }
  };

  return (
    <>
      {pendingModal && <PendingModal onClose={() => setPendingModal(false)} />}
      {rejectModal && <RejectedModal onClose={() => setRejectModal(false)}/>}
      <DriverLoginForm
        auth={auth}
        otpInput={otpInput}
        setOtpInput={setOtpInput}
        otp={otp}
        setOtp={setOtp}
        load={load}
        setLoad={setLoad}
        counter={counter}
        setCounter={setCounter}
        confirmationResult={confirmationResult}
        setConfirmationResult={setConfirmationResult}
        driverData={driverData}
        setDriverData={setDriverData}
        onGoogleLogin={handleGoogleLogin}
        setRejectModal={setRejectModal}
        setPendingModal={setPendingModal}
      />
      <div id="recaptcha-container" />
    </>
  );
};

export default DriverLogin;