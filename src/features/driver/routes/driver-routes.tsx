import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import PublicRoute from "@/routes/public-route";
import ProtectedRoute from "@/routes/protected-route";
import AppRoutes from "@/constants/app-routes";
import GlobalLoading from "@/shared/components/loaders/GlobalLoading";
import { useDriverSocketEvents } from "@/shared/hooks/useDriverSocketEvents";
import { LocationProvider } from "@/context/locationProvider";
import DriverWallet from "../pages/WallerPage";

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
  return (
    <>
      <Suspense fallback={<GlobalLoading {...loaderProps} />}>
        <LocationProvider>
          <Routes>
            <Route element={<ProtectedRoute allowedRole={"Driver"} />}>
              <Route path={AppRoutes.DASHBOARD} element={<Dashboard />} />
              <Route path={AppRoutes.PROFILE} element={<DriverProfile />} />
              <Route path={AppRoutes.DOCUMENTS} element={<DriverDocuments />} />
              <Route path={AppRoutes.WALLET} element={<DriverWallet />} />
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
