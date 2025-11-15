import { useEffect } from "react";
import SocketService from "@/shared/services/socketService";
import { useDispatch } from "react-redux";
import { notificationReceived } from "../services/redux/slices/notificationSlice";

export function useUserSocketEvents() {
  const dispatch = useDispatch();

  useEffect(() => {
    const unregister = SocketService.registerEventHandler((ev) => {
      switch (ev.type) {
        case "notification":
          dispatch(notificationReceived(ev.payload));
          break;

        case "ride.status":
          dispatch({ type: "ride/status", payload: ev.payload });
          break;

        default:
          break;
      }
    });

    return () => {unregister();}
  }, []);
}
