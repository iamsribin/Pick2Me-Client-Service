import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/shared/services/redux/store";
import { clearRideRequest } from "@/shared/services/redux/slices/rideRequestSlice";
import SocketService from "@/shared/services/socketService";
import { useNavigate } from "react-router-dom";
import { emitSocket } from "@/shared/utils/emitSocket";

export default function RideRequestModal() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const request = useSelector((s: RootState) => s.rideRequest.active);
  const timeoutSec = useSelector((s: RootState) => s.rideRequest.timeoutSec) ?? 30;
  const arrivedAt = useSelector((s: RootState) => s.rideRequest.arrivedAt) ?? Date.now();

  const [remaining, setRemaining] = useState<number>(timeoutSec);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!request) {
      setRemaining(timeoutSec);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      return;
    }

    // start ring
    if (!audioRef.current) {
      audioRef.current = new Audio("/uber_tune.mp3"); 
      audioRef.current.loop = true;
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.play().catch(() => {});
    }

    // try browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("New ride request", {
        body: `${request.user.userName} - ${request.distanceInfo?.distance || ""}`,
      });
    } else if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          new Notification("New ride request", { body: `${request.user.userName}` });
        }
      });
    }

    // compute initial remaining based on arrivedAt
    const elapsed = Math.floor((Date.now() - (arrivedAt || Date.now())) / 1000);
    setRemaining(Math.max(timeoutSec - elapsed, 0));

    // interval
    timerRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(timerRef.current!);
          timerRef.current = null;
          handleDecline("timeout");
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  const emitResponse = (action: "accept" | "decline", reason?: string) => {
    if (!request) return;
    // Format expected by server — adapt as needed
    const payload = {
      rideId: request.rideId,
      action:action.toUpperCase(),
      rideData:request,
    };
    dispatch(emitSocket("ride:response",payload))
    // SocketService.emit(, payload);
  };

  const handleAccept = () => {
    if (!request) return;
    emitResponse("accept");
    // optimistic: navigate to ride screen or show spinner while server responds
    dispatch(clearRideRequest());
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // navigate to driver ride page (adjust route)
    navigate(`/driver/ride/${request.rideId || request.id}`);
  };

  const handleDecline = (reason = "declined") => {
    if (!request) return;
    emitResponse("decline", reason);
    dispatch(clearRideRequest());
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  if (!request) return null;

  // simple modal UI - style to match your app
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto max-w-xl w-full mx-4 bg-white rounded-2xl shadow-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold">New ride request</h3>
            <p className="text-sm text-muted-foreground">
              {request.user?.userName} • {request.distanceInfo?.distance || request.duration}
            </p>
            <p className="mt-2 text-sm">
              Pickup: {request.pickupCoordinates?.address || "Unknown"}
            </p>
            <p className="text-sm">Drop: {request.dropOffCoordinates?.address || "Unknown"}</p>
            <p className="mt-3 text-sm">Fare: {request.price}</p>
            <div className="mt-3">
              <div className="text-xs text-gray-500">Auto decline in {remaining}s</div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleAccept}
              className="px-4 py-2 rounded-lg bg-green-600 text-white"
            >
              Accept
            </button>
            <button
              onClick={() => handleDecline("driver_declined")}
              className="px-4 py-2 rounded-lg bg-gray-200"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
