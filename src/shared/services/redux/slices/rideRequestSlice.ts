import { RideDetails } from "@/shared/types/common";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type State = {
  active?: RideDetails | null;
  timeoutSec?: number; 
  arrivedAt?: number;
};

const initialState: State = {
  active: null,
  timeoutSec: undefined,
  arrivedAt: undefined,
};

const slice = createSlice({
  name: "rideRequest",
  initialState,
  reducers: {
    showRideRequest(state, action: PayloadAction<{ ride: RideDetails; timeoutSec?: number }>) {
      state.active = action.payload.ride;
      state.timeoutSec = action.payload.timeoutSec ?? 30;
      state.arrivedAt = Date.now();
    },
    clearRideRequest(state) {
      state.active = null;
      state.timeoutSec = undefined;
      state.arrivedAt = undefined;
    },
  },
});

export const { showRideRequest, clearRideRequest } = slice.actions;
export default slice.reducer;
