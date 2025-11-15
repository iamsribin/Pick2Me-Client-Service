import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import SocketService from "@/shared/services/socketService";
import type { Role } from "@/shared/types/common";

export default function useSocket(rolesAllowed?: Role[]) {
  const loggedIn = useSelector((s: any) => s.user.loggedIn);
  const role = useSelector((s: any) => s.user.role);

  const connectTimer = useRef<number | null>(null);

  useEffect(() => {

    if (rolesAllowed && !rolesAllowed.includes(role as Role)) {
      SocketService.disconnect();
      return;
    }

    if (!loggedIn) {
      SocketService.disconnect();
      return;
    }


    if (connectTimer.current) {
      window.clearTimeout(connectTimer.current);
      connectTimer.current = null;
    }

    connectTimer.current = window.setTimeout(() => {
      SocketService.connect();
    }, 150);

    return () => {
      if (connectTimer.current) {
        window.clearTimeout(connectTimer.current);
        connectTimer.current = null;
      }
      SocketService.disconnect();
    };
  }, [loggedIn, role, rolesAllowed]); 
}
