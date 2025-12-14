import { useEffect, useRef } from "react";
import SocketService from "@/shared/services/socketService";
import { useDispatch, useSelector } from "react-redux";
import {
  clearRide,
  rideCreate,
  rideLocationReceived,
  updateRideStatus,
} from "../services/redux/slices/rideSlice";
import { notificationReceived } from "../services/redux/slices/notificationSlice";
import { toast } from "./use-toast";
import { RootState } from "../services/redux/store";

export function useUserSocketEvents() {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);


  useEffect(() => {
    if (user.role !== "User") return;

    SocketService.connect();

    const offNotification = SocketService.on("notification", (data) => {
      dispatch(notificationReceived(data));
    });

    const offRide = SocketService.on("ride:accepted", (data) => {
      console.log("ride:accepted", data);

      dispatch(notificationReceived(data.userNotification));
      dispatch(rideCreate(data.rideData));
      dispatch(
        rideLocationReceived({
          ...data.driverLocation,
          serverTs: data.driverLocation.serverTs || Date.now(),
        })
      );
    });

    const offRideStart = SocketService.on("ride:start", (data) => {
      console.log("ride:start", data);
      dispatch(updateRideStatus({ status: data }));
    });

    const offClearRide = SocketService.on("ride:canceled", (data) => {
      console.log("ride:canceled", data);
      dispatch(notificationReceived(data.userNotification));
      dispatch(clearRide());
    });

    const offError = SocketService.on("error", (data) => {
      toast({ description: data.message, variant: "error" });
    });

    const offLocationUpdate = SocketService.on(
      "driver:location:update",
      (data) => {
        console.log("driver:location:update", data);
        dispatch(
          rideLocationReceived({
            ...data,
            serverTs: data.serverTs || Date.now(),
          })
        );
      }
    );

    // const offDriverLocation = SocketService.on("driver.location", (data) => {
    //   latestPosRef.current = data;
    //   if (!flushTimerRef.current) {
    //     flushTimerRef.current = window.setTimeout(flush, 200);
    //   }
    // });

    return () => {
      offNotification();
      offLocationUpdate();
      offError();
      offRide();
      offClearRide();
      offRideStart();
      // if (flushTimerRef.current) {
      //   window.clearTimeout(flushTimerRef.current);
      //   flushTimerRef.current = null;
      // }
      // latestPosRef.current = null;
      // tab to release leadership
      // socket connected at App-level; only disconnect on logout or unmount of App
    };
  }, [dispatch]);
}
