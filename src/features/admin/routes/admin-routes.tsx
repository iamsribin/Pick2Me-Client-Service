import { Routes, Route } from "react-router-dom";

import Dashboard from "../pages/admin/Dashboard";
import Users from "../pages/user/UsersList";
import Drivers from "../pages/driver/DriversList";
import DriverDetails from "../pages/driver/DriverDetails";
import ProtectedRoute from "@/routes/protected-route";
import NotFound from "@/shared/components/NotFound";
import AppRoutes from "@/constants/app-routes";
import UserDetails from "../pages/user/UserDetailsPage";
import { useAdminSocketEvents } from "@/shared/hooks/useAdminSocketEvents";
import {
  incrementUnread,
  setUnreadCount,
} from "@/shared/services/redux/slices/issuesSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchData } from "@/shared/services/api/api-service";
import { AdminApiEndpoints } from "@/constants/admin-api-end-pointes";
import { handleCustomError } from "@/shared/utils/error";

function AdminRoutes() {
  const dispatch = useDispatch();
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "issue:created") {
          dispatch(incrementUnread());
        }
      });
    }

    (async () => {
      try {
        const res = await fetchData(AdminApiEndpoints.FETCH_ISSUES);

        if (res?.status == 200) {
          const count = res.data as number;
          dispatch(setUnreadCount(count));

          if (navigator.setAppBadge) await navigator.setAppBadge(count);
        }
      } catch (error) {
        handleCustomError(error);
      }
    })();
  }, []);
  
  useAdminSocketEvents();
  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRole={"Admin"} />}>
        <Route path={AppRoutes.DASHBOARD} element={<Dashboard />} />
        <Route path={AppRoutes.ADMIN_USERS} element={<Users />} />
        <Route path={AppRoutes.ADMIN_DRIVERS} element={<Drivers />} />
        <Route path={"drivers/:id"} element={<DriverDetails />} />
        <Route path={"users/:id"} element={<UserDetails />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AdminRoutes;
