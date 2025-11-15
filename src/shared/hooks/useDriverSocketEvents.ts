import { useEffect } from "react";
import SocketService from "@/shared/services/socketService";
import { rideLocationReceived } from "../services/redux/slices/rideSlice";
import { notificationReceived } from "../services/redux/slices/notificationSlice";
import { store } from "../services/redux/store";

export function useDriverSocketEvents() {

  let latestPos: any = null;
  let flushTimer: number | null = null;
  
  const flush = () => {
    if (latestPos) {
      store.dispatch(rideLocationReceived(latestPos));
      latestPos = null;
    }
    if (flushTimer) {
      window.clearTimeout(flushTimer);
      flushTimer = null;
    }
  };

  useEffect(() => {
    const unregister =  SocketService.registerEventHandler((ev) => {
    if (ev.type === "driver.location") {
      latestPos = ev.payload; 
      if (!flushTimer) {
        flushTimer = window.setTimeout(flush, 200); // 5Hz
      }
      return;
    }
    switch (ev.type) {
      case 'notification':
        store.dispatch(notificationReceived(ev.payload));
        break;
      case 'ride.status':
        // storeAPI.dispatch(rideStatusReceived(ev.payload));
        break;
      default:
        console.warn('unknown', ev);
    }
  });

    return () => { unregister(); };
  }, []);
}
