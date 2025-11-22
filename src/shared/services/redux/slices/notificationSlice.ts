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
      state.items.unshift(n); 
    },
    markRead(state, action: PayloadAction<string>) {
      const id = action.payload;
      const item = state.items.find(i => i.id === id);
      if (item) item.read = true;
    },
    markAllAsRead(state) {
      state.items.forEach(item => {
        item.read = true;
      });
    },
    clearNotification(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.items = state.items.filter(i => i.id !== id);
    },
    clearAllNotifications(state) {
      state.items = [];
    },
    setNotifications(state, action: PayloadAction<NotificationMessage[]>) {
      state.items = action.payload;
    },
  },
});

export const { 
  notificationReceived, 
  markRead, 
  markAllAsRead,
  clearNotification,
  clearAllNotifications,
  setNotifications
} = slice.actions;

export default slice;