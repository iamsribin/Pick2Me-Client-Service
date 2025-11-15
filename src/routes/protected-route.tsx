import { store } from "@/shared/services/redux/store";
import { Role } from "@/shared/types/common";
import { Navigate, Outlet } from "react-router-dom";

interface PropType {
    allowedRole: Role;
}

// Protected Route
function ProtectedRoutes({ allowedRole }: PropType) {
    
      const state = store.getState();
      const {role,loggedIn} = state.user;
      console.log({role,loggedIn});

    // Check auth and role
    if (!loggedIn || allowedRole !== role) {
        return <Navigate to={allowedRole === "Driver" ? "/driver/login" : "/login"} />;
    }

    return <Outlet />;
}

export default ProtectedRoutes;