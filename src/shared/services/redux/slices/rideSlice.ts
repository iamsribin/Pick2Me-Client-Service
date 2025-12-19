import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { DriverLocationMessage, RideDetails, RideStatus } from "@/shared/types/common";

type PositionsMap = Record<string, DriverLocationMessage[]>;

export interface ChatMessage {
  id: string;               
  text: string;
  image?: string;
  sender: "user" | "driver";
  time: string;             
  edited?: boolean;          
  deleted?: boolean;         
}

type ChatMap = Record<string, ChatMessage[]>; 

const MAX_BUFFER = 200;

const slice = createSlice({
  name: "ride",
  initialState: {
    latest: {} as Record<string, DriverLocationMessage | undefined>,
    rideDetails: {} as RideDetails,
    positions: {} as PositionsMap,
    status: "" as RideStatus,
    chat: {} as ChatMap,           
    unreadCounts: {} as Record<string, number>, 
  },
  reducers: {
    rideLocationReceived(state, action: PayloadAction<DriverLocationMessage>) {
      const p = action.payload;
      const arr = state.positions[p.rideId] ?? [];
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

    updateRideStatus(state, action: PayloadAction<{ status: RideStatus }>) {
      state.status = action.payload.status;
    },

   addMessage(state, action: PayloadAction<{ rideId: string; message: ChatMessage }>) {
      const { rideId, message } = action.payload;
      const messages = state.chat[rideId] ?? [];
      messages.push(message);
      state.chat[rideId] = messages;

      // If message is from the other party → increase unread
      if (message.sender !== (state.rideDetails.driver ? "driver" : "user")) {
        state.unreadCounts[rideId] = (state.unreadCounts[rideId] ?? 0) + 1;
      }
    },

    editMessage(
      state,
      action: PayloadAction<{ rideId: string; messageId: string; newText: string }>
    ) {
      const { rideId, messageId, newText } = action.payload;
      const messages = state.chat[rideId] ?? [];
      const msg = messages.find((m) => m.id === messageId);
      if (msg) {
        msg.text = newText;
        msg.edited = true;
      }
    },

    deleteMessage(state, action: PayloadAction<{ rideId: string; messageId: string }>) {
      const { rideId, messageId } = action.payload;
      const messages = state.chat[rideId] ?? [];
      const msg = messages.find((m) => m.id === messageId);
      if (msg) msg.deleted = true;
    },

    markChatAsRead(state, action: PayloadAction<string>) {
      const rideId = action.payload;
      state.unreadCounts[rideId] = 0;
    },

    clearRide(state) {
      state.latest = {};
      state.positions = {};
      state.rideDetails = {} as RideDetails;
      state.status = "";
      state.chat = {};
      state.unreadCounts = {};
    },
  },
});

export const {
  rideLocationReceived,
  rideCreate,
  clearRide,
  updateRideStatus,
  addMessage,
  editMessage,
  deleteMessage,
  markChatAsRead,
} = slice.actions;

export default slice;