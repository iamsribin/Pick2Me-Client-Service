import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface IssuesState {
  unreadCount: number;
}
const initialState: IssuesState = { unreadCount: 0 };

const issuesSlice = createSlice({
  name: 'issues',
  initialState,
  reducers: {
    setUnreadCount(state, action: PayloadAction<number>) {
      state.unreadCount = action.payload;
    },
    incrementUnread(state) {
      state.unreadCount += 1;
    },
    decrementUnread(state) {
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
    resetUnread(state) {
      state.unreadCount = 0;
    },
  },
});

export const { setUnreadCount, incrementUnread, decrementUnread, resetUnread } = issuesSlice.actions;
export default issuesSlice;
