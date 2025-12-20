import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/routes/protected-route";
import AppRoutes from "@/constants/app-routes";
import NotFound from "@/shared/components/NotFound";
import BookingTransaction from "../pages/BookingTransaction";
import BookingDetails from "../pages/BookingDetails";
import PaymentPage from "../components/ride/PaymentPage";
import PublicRoutes from "@/routes/public-route";
import { Suspense, lazy, useEffect } from "react";

import GlobalLoading from "@/shared/components/loaders/GlobalLoading";
import { useUserSocketEvents } from "@/shared/hooks/useUserSocketEvents";
import UserRideTracking from "../pages/rideTrackingPage";
import { useDispatch } from "react-redux";
import { fetchData } from "@/shared/services/api/api-service";
import { CommonApiEndPoint } from "@/constants/common-api-ent-point";
import { handleCustomError } from "@/shared/utils/error";
import { setNotifications } from "@/shared/services/redux/slices/notificationSlice";
import { ResponseCom } from "@/shared/types/common";
import { store } from "@/shared/services/redux/store";
import {
  rideCreate,
  rideLocationReceived,
} from "@/shared/services/redux/slices/rideSlice";

const UserProfile = lazy(() => import("../pages/UserProfile"));
const LoginPage = lazy(() => import("../pages/LoginPage"));
const SignupPage = lazy(() => import("../pages/SignupPage"));
const HomePage = lazy(() => import("../pages/HomePage"));

const ROLE = "User";

const loaderProps = {
  isLoading: true,
  loadingMessage: "Loading page...",
};

function UserRoutes() {
  useUserSocketEvents();
  const dispatch = useDispatch();

  useEffect(() => {
    (async () => {
      try {
        if (store.getState().user.role !== "User") return;
        const res = await fetchData<ResponseCom["data"]>(
          CommonApiEndPoint.NOTIFICATIONS
        );

        if (res?.status == 200) {
          const notifications = res.data.data;
          console.log("notifications", notifications);

          dispatch(setNotifications(notifications));
        }
      } catch (error) {
        handleCustomError(error);
      }
    })();

    (async () => {
      try {
        if (store.getState().user.role !== "User") return;
        const res = await fetchData<ResponseCom["data"]>(
          CommonApiEndPoint.BOOKING_DATA
        );

        if (res?.status == 200) {
          const data = res.data;
          
          dispatch(rideCreate(data.rideData));
          if (data.driverLocation) {
            dispatch(
              rideLocationReceived({
                ...data.driverLocation,
                serverTs: data.driverLocation.serverTs || Date.now(),
              })
            );
          }
        }
      } catch (error) {
        handleCustomError(error);
      }
    })();
  }, []);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-black to-gray-800 text-white pb-20 sm:pb-4 sm:pl-64">
          <GlobalLoading {...loaderProps} />
        </div>
      }
    >
      <Routes>
        <Route path={AppRoutes.USER_HOME} element={<HomePage />} />

        <Route element={<ProtectedRoute allowedRole={ROLE} />}>
          <Route path={AppRoutes.PROFILE} element={<UserProfile />} />
          <Route
            path={"/ride-tracking/:rideId"}
            element={<UserRideTracking />}
          />

          {/* 
             <Route path={AppRoutes.TRIPS} element={<ProtectedRoute allowedRole={ROLE}><BookingTransaction/></ProtectedRoute>}/>
             <Route path={`${AppRoutes.GET_MY_TRIP_DETAILS}/:bookingId`} element={<ProtectedRoute allowedRole={ROLE}><BookingDetails/></ProtectedRoute>} />
             <Route path={AppRoutes.DASHBOARD} element={<Dashboard />} />
             
             <Route path={AppRoutes.PAYMENT} element={<ProtectedRoute allowedRole={ROLE}><PaymentPage/></ProtectedRoute>} /> */}
          {/* <Route path={AppRoutes.RIDE_TRACKING} element={<ProtectedRoute allowedRole={ROLE}><RideMap/></ProtectedRoute>}/> */}
        </Route>

        <Route element={<PublicRoutes allowedRoles={["Admin", "User"]} />}>
          <Route path={AppRoutes.LOGIN} element={<LoginPage />} />
          <Route path={AppRoutes.SIGNUP} element={<SignupPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default UserRoutes;
