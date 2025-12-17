import { Suspense, lazy, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import PublicRoute from "@/routes/public-route";
import ProtectedRoute from "@/routes/protected-route";
import AppRoutes from "@/constants/app-routes";
import GlobalLoading from "@/shared/components/loaders/GlobalLoading";
import { useDriverSocketEvents } from "@/shared/hooks/useDriverSocketEvents";
import { LocationProvider } from "@/context/locationProvider";
import DriverWallet from "../pages/WallerPage";
import RideRequestModal from "../components/RideRequestModal";
import DriverRideTracking from "../components/rideTrackingPage";
import { useDispatch } from "react-redux";
import { store } from "@/shared/services/redux/store";
import { fetchData } from "@/shared/services/api/api-service";
import { ResponseCom } from "@/shared/types/common";
import { CommonApiEndPoint } from "@/constants/common-api-ent-point";
import { setNotifications } from "@/shared/services/redux/slices/notificationSlice";
import { handleCustomError } from "@/shared/utils/error";

const DriverLoginPage = lazy(() => import("../pages/auth/DriverLoginPage"));
const DriverSignupPage = lazy(() => import("../pages/auth/DriverSignupPage"));
const ResubmissionPage = lazy(() => import("../pages/auth/ResubmissionPage"));
const NotFound = lazy(() => import("@/shared/components/NotFound"));
const Dashboard = lazy(() => import("../pages/DriverDashboard"));
const DriverProfile = lazy(() => import("../pages/DriverProfile"));
const DriverDocuments = lazy(() => import("../pages/DriverDocument"));

const BookingTransaction = lazy(() => import("../pages/BookingTransaction"));
const BookingDetails = lazy(() => import("../pages/BookingDetails"));
const PaymentPage = lazy(() => import("../pages/paymentPage"));
const DriverRideMap = lazy(() => import("../pages/DriverRideMap"));

function DriverRoutes() {
  const loaderProps = {
    isLoading: true,
    loadingMessage: "Loading page...",
  };
  useDriverSocketEvents();
    const dispatch = useDispatch();
      useEffect(() => {
        (async () => {
          try {
            if(store.getState().user.role !== "Driver") return;
            const res = await fetchData<ResponseCom["data"]>(CommonApiEndPoint.NOTIFICATIONS);
    
            if (res?.status == 200) {
              const notifications = res.data.data;
              console.log("notifications",notifications);
              
              dispatch(setNotifications(notifications));
              }
          } catch (error) {
            handleCustomError(error);
          }
        })();
      }, []);
  return (
    <>
      <RideRequestModal />
      <Suspense fallback={<GlobalLoading {...loaderProps} />}>
        <LocationProvider>
          <Routes>
            <Route element={<ProtectedRoute allowedRole={"Driver"} />}>
              <Route path={AppRoutes.DASHBOARD} element={<Dashboard />} />
              <Route path={AppRoutes.PROFILE} element={<DriverProfile />} />
              <Route path={AppRoutes.DOCUMENTS} element={<DriverDocuments />} />
              <Route path={AppRoutes.WALLET} element={<DriverWallet />} />
              <Route path={"ride-tracking/:rideId"} element={<DriverRideTracking />} />
            </Route>

            <Route element={<PublicRoute allowedRoles={["Driver"]} />}>
              <Route path={AppRoutes.LOGIN} element={<DriverLoginPage />} />
              <Route path={AppRoutes.SIGNUP} element={<DriverSignupPage />} />
              <Route
                path={AppRoutes.DRIVER_RESUBMISSION}
                element={<ResubmissionPage />}
              />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </LocationProvider>
      </Suspense>
    </>
  );
}

export default DriverRoutes;
