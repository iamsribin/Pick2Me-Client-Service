import { Role } from "@/shared/types/common";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  name: string;
  id: string;
  loggedIn: boolean;
  role: Role | null;
  isOnline: boolean;
  OnlineTimestamp: Date | null
}

const initialState: UserState = {
  name: "",
  id: "",
  loggedIn: false,
  role: null,
  isOnline:false,
  OnlineTimestamp:null,
};

const driverAuthSlice = createSlice({
  name: "driverAuth",
  initialState,
  reducers: {
    userLogin: (
      state,
      action: PayloadAction<{
        name: string;
        id: string;
        role: Role ;
      }>
    ) => {
      state.name = action.payload.name;
      state.id = action.payload.id;
      state.loggedIn = true;
      state.role = action.payload.role;
    },
    userLogout: (state) => {
      state.name = "";
      state.id = "";
      state.loggedIn = false;
      state.role = null;
      state.isOnline = false;
    },
    setOnline: (
  state,
  action: PayloadAction<{
    onlineStatus: boolean;
  }>
) => {
  state.isOnline = action.payload.onlineStatus;
  state.OnlineTimestamp = action.payload.onlineStatus ? new Date() : null;
}
  },
});

export const { userLogin, userLogout, setOnline } = driverAuthSlice.actions;

export default driverAuthSlice;