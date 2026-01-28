import { AuthState, User } from "@/types/auth.types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: AuthState = {
  user: null,
  accessToken: null, // 🔥 ADD
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // setCredentials: (
    //   state,
    //   action: PayloadAction<{ user: User; accessToken: string }>
    // ) => {
    //   state.user = action.payload.user;
    //   state.accessToken = action.payload.accessToken;
    //   state.isAuthenticated = true;
    // },
setCredentials: (
  state,
  action: PayloadAction<{ user: User; accessToken?: string }>
) => {
  state.user = action.payload.user;
  if (action.payload.accessToken !== undefined) {
    state.accessToken = action.payload.accessToken;
  }
  
  state.isAuthenticated = !!action.payload.user;
},
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
