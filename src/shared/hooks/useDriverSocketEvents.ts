import { useEffect, useRef } from "react";
import SocketService from "@/shared/services/socketService";
import { useDispatch, useSelector } from "react-redux";
import { rideLocationReceived } from "../services/redux/slices/rideSlice";
import { notificationReceived } from "../services/redux/slices/notificationSlice";
import { RootState } from "../services/redux/store";
import { toast } from "./use-toast";

export function useDriverSocketEvents() {
  const dispatch = useDispatch();
  const latestPosRef = useRef<any>(null);
  const flushTimerRef = useRef<number | null>(null);

  const flush = () => {
    if (latestPosRef.current) {
      dispatch(rideLocationReceived(latestPosRef.current));
      latestPosRef.current = null;
    }
    if (flushTimerRef.current) {
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  };
  const user = useSelector((state: RootState) => state.user);

  useEffect(() => {
    if (user.role !== "Driver") return;
    SocketService.connect();

    const offNotification = SocketService.on("notification", (data) => {
      console.log("data of notificaito", data);

      dispatch(notificationReceived(data));
    });

    const offError = SocketService.on("error", (data) => {
      toast({ description: data.message, variant: "error" });
    });

    const offHai = SocketService.on("hai", (data) => {
      console.log("hai", data);
    });

    const offDriverLocation = SocketService.on("driver.location", (data) => {
      latestPosRef.current = data;
      if (!flushTimerRef.current) {
        flushTimerRef.current = window.setTimeout(flush, 200);
      }
    });

    return () => {
      offNotification();
      offDriverLocation();
      offHai();
      offError();
      if (flushTimerRef.current) {
        window.clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      latestPosRef.current = null;
      // tab to release leadership
      // socket connected at App-level; only disconnect on logout or unmount of App
    };
  }, [dispatch, user.role]);
}
