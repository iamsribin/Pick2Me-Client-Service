import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { DriverLocationMessage, PaymentStatus, RideStatusMessage } from '@/shared/types/common';

type PositionsMap = Record<string, DriverLocationMessage[]>; // rideId -> positions

const MAX_BUFFER = 200;

const slice = createSlice({
  name: 'ride',
  initialState: {
    latest: {} as Record<string, DriverLocationMessage | undefined>,
    positions: {} as PositionsMap,
    status: {} as Record<string, RideStatusMessage | undefined>,
    paymentStatus: {} as Record<string, PaymentStatus| undefined>
  },
  reducers: {
    rideLocationReceived(state, action: PayloadAction<DriverLocationMessage>) {
      const p = action.payload;
      const arr = state.positions[p.rideId] ?? [];
      const last = arr[arr.length - 1];

      if (p.id && arr.some(a => a.id === p.id)) return;

      if (last && p.seq !== undefined && last.seq !== undefined && p.seq <= last.seq) {
        return;
      }

      arr.push(p);
      if (arr.length > MAX_BUFFER) arr.shift();
      state.positions[p.rideId] = arr;
      state.latest[p.rideId] = p;
    },
    rideStatusReceived(state, action: PayloadAction<RideStatusMessage>) {
      const s = action.payload;
      const current = state.status[s.rideId];
      if (current && current.updatedAt > s.updatedAt) return;
      state.status[s.rideId] = s;
    },
  },
});

export const { rideLocationReceived, rideStatusReceived } = slice.actions;
export default slice;
