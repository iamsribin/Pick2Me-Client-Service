import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { DriverLocationMessage, RideDetails } from "@/shared/types/common";

type PositionsMap = Record<string, DriverLocationMessage[]>; // rideId -> positions

const MAX_BUFFER = 200;

const slice = createSlice({
  name: "ride",
  initialState: {
    // status: {} as Record<string, RideStatusMessage | undefined>,
    // paymentStatus: {} as Record<string, PaymentStatus| undefined>
    latest: {} as Record<string, DriverLocationMessage | undefined>,
    rideDetails: {} as RideDetails,
    positions: {} as PositionsMap,
    status: "" as "Pending" | "Accepted" | "InRide" | "Completed" | "Cancelled" | "",
    chat: {} as any,
  },
  reducers: {
    rideLocationReceived(state, action: PayloadAction<DriverLocationMessage>) {
      const p = action.payload;
      const arr = state.positions[p.rideId] ?? [];
      const last = arr[arr.length - 1];

      if (p.id && arr.some((a) => a.id === p.id)) return;

      if (
        last &&
        p.seq !== undefined &&
        last.seq !== undefined &&
        p.seq <= last.seq
      ) {
        return;
      }

      arr.push(p);
      if (arr.length > MAX_BUFFER) arr.shift();
      state.positions[p.rideId] = arr;
      state.latest[p.rideId] = p;
    },
    rideCreate(state, action: PayloadAction<RideDetails>) {
      const s = action.payload;
      state.rideDetails = s;
      state.status = s.status;
    },
     clearRide(state) {
      state.latest = {};
      state.positions = {};
      state.rideDetails = {} as RideDetails;
      state.status = "";
      state.chat = {};
    },
  },
});

export const { rideLocationReceived, rideCreate, clearRide } = slice.actions;
export default slice;
