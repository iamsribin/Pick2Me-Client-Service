 
import { Routes, Route } from "react-router-dom";

import Dashboard from "../pages/admin/Dashboard";
import Users from "../pages/user/UsersList";
import Drivers from "../pages/driver/DriversList";
import AdminUserDetails from "../pages/user/UserDetailsPage";
import DriverDetails from "../pages/driver/DriverDetails";
import ProtectedRoute from "@/routes/protected-route";
import NotFound from "@/shared/components/NotFound";
import AppRoutes from "@/constants/app-routes";
import UserDetails from "../pages/user/UserDetailsPage";
import { useAdminSocketEvents } from "@/shared/hooks/useAdminSocketEvents";

function AdminRoutes() {
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
      {/* 
      <Route path={AppRoutes.ADMIN_DRIVER_DETAILS+"/:id"} element={<ProtectedRoute allowedRole={ROLE}><DriverDetails /></ProtectedRoute>} />
       */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AdminRoutes;
