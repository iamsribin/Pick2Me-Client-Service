import { store } from "@/shared/services/redux/store";
import { Role } from "@/shared/types/common";
import { Navigate, Outlet } from "react-router-dom";

interface PropsType {
  allowedRoles: Role[]; 
}

function PublicRoutes({ allowedRoles }: PropsType) {
  const { role, loggedIn } = store.getState().user;

  if (loggedIn && role && allowedRoles.includes(role)) {
    const redirectPath = role =="User" ? "/" :  `/${role.toLowerCase()}/dashboard`;
    return <Navigate to={redirectPath} replace />;
    }
  

  return <Outlet />;
}

export default PublicRoutes;