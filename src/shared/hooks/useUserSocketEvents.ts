import { useEffect, useRef } from "react";
import SocketService from "@/shared/services/socketService";
import { useDispatch } from "react-redux";
import { rideLocationReceived } from "../services/redux/slices/rideSlice";
import { notificationReceived } from "../services/redux/slices/notificationSlice";

export function useUserSocketEvents() {
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

  useEffect(() => {
    SocketService.connect();

    const offNotification = SocketService.on("notification", (data) => {
      dispatch(notificationReceived(data));
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
      if (flushTimerRef.current) {
        window.clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      latestPosRef.current = null;
      // tab to release leadership
      // socket connected at App-level; only disconnect on logout or unmount of App
    };
  }, [dispatch]);
}
