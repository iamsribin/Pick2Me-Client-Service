import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { NotificationMessage } from '@/shared/types/common';

const slice = createSlice({
  name: 'notifications',
  initialState: {
    items: [] as NotificationMessage[],
    lastSeenId: null as string | null,
  },
  reducers: {
    notificationReceived(state, action: PayloadAction<NotificationMessage>) {
      const n = action.payload;
      // dedupe
      if (state.items.some(i => i.id === n.id)) return;
      state.items.unshift(n); // newest first
    },
    markRead(state, action: PayloadAction<string>) {
      const id = action.payload;
      const item = state.items.find(i => i.id === id);
      if (item) item.read = true;
    },
  },
});

export const { notificationReceived, markRead } = slice.actions;
export default slice;
