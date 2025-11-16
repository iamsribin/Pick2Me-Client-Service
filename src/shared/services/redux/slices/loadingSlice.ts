// import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// export type LoadingType = 
//   | 'default'           // General loading
//   | 'ride-request'      // Requesting a ride
//   | 'ride-search'       // Searching for drivers
//   | 'ride-tracking'     // Tracking active ride
//   | 'payment'           // Processing payment
//   | 'location'          // Getting location
//   | 'profile'           // Profile operations
//   | 'authentication'    // Login/signup
//   | 'document-upload'   // Document verification
//   | 'driver-verification' // Driver verification process
//   | 'ride-completion'   // Completing ride
//   | 'booking'           // Booking operations
//   | 'map-loading';      // Map initialization

// export interface LoadingState {
//   isLoading: boolean;
//   loadingType: LoadingType;
//   loadingMessage?: string;
//   progress?: number; // For operations that can show progress (0-100)
// }

// const initialState: LoadingState = {
//   isLoading: false,
//   loadingType: 'default',
//   loadingMessage: undefined,
//   progress: undefined,
// };

// export interface SetLoadingPayload {
//   isLoading: boolean;
//   loadingType?: LoadingType;
//   loadingMessage?: string;
//   progress?: number;
// }

// const loadingSlice = createSlice({
//   name: 'loading',
//   initialState,
//   reducers: {
//     setLoading: (state, action: PayloadAction<SetLoadingPayload>) => {
//       const { isLoading, loadingType = 'default', loadingMessage, progress } = action.payload;
      
//       state.isLoading = isLoading;
      
//       if (isLoading) {
//         state.loadingType = loadingType;
//         state.loadingMessage = loadingMessage;
//         state.progress = progress;
//       } else {
//         // Reset when loading is done
//         state.loadingMessage = undefined;
//         state.progress = undefined;
//       }
//     },
    
//     updateLoadingProgress: (state, action: PayloadAction<{ progress: number; message?: string }>) => {
//       if (state.isLoading) {
//         state.progress = action.payload.progress;
//         if (action.payload.message) {
//           state.loadingMessage = action.payload.message;
//         }
//       }
//     },
    
//     clearLoading: (state) => {
//       state.isLoading = false;
//       state.loadingMessage = undefined;
//       state.progress = undefined;
//       state.loadingType = 'default';
//     },
//   },
// });

// export const { setLoading, updateLoadingProgress, clearLoading } = loadingSlice.actions;
// export default loadingSlice;