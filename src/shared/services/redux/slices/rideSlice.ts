import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { DriverLocationMessage, RideStatusMessage } from '@/shared/types/common';

type PositionsMap = Record<string, DriverLocationMessage[]>; // rideId -> positions

const MAX_BUFFER = 200;

const slice = createSlice({
  name: 'ride',
  initialState: {
    latest: {} as Record<string, DriverLocationMessage | undefined>,
    positions: {} as PositionsMap,
    status: {} as Record<string, RideStatusMessage | undefined>,
  },
  reducers: {
    rideLocationReceived(state, action: PayloadAction<DriverLocationMessage>) {
      const p = action.payload;
      const arr = state.positions[p.rideId] ?? [];
      const last = arr[arr.length - 1];

      // dedupe by id
      if (p.id && arr.some(a => a.id === p.id)) return;

      // out-of-order protection using seq or ts
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
      // basic guard for stale updates using updatedAt
      if (current && current.updatedAt > s.updatedAt) return;
      state.status[s.rideId] = s;
    },
  },
});

export const { rideLocationReceived, rideStatusReceived } = slice.actions;
export default slice;
