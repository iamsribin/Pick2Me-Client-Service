// import { useDispatch, useSelector } from 'react-redux';
// import { useCallback } from 'react';
// import { RootState } from '@/shared/services/redux/store';
// import { LoadingType } from '../types/common';
// // import { 
// //   setLoading, 
// //   updateLoadingProgress, 
// //   clearLoading,
// //   LoadingType,
// //   SetLoadingPayload 
// // } from '@/shared/services/redux/slices/loadingSlice';

// // export const useLoading = () => {
// //   const dispatch = useDispatch();
// //   const loadingState = useSelector((state: RootState) => state.loading);

// //   const showLoading = useCallback((payload: SetLoadingPayload) => {
// //     dispatch(setLoading({ ...payload, isLoading: true }));
// //   }, [dispatch]);

// //   const hideLoading = useCallback(() => {
// //     dispatch(setLoading({ isLoading: false }));
// //   }, [dispatch]);

// //   const updateProgress = useCallback((progress: number, message?: string) => {
// //     dispatch(updateLoadingProgress({ progress, message }));
// //   }, [dispatch]);

// //   const clear = useCallback(() => {
// //     dispatch(clearLoading());
// //   }, [dispatch]);

// //   return {
// //     ...loadingState,
// //     showLoading,
// //     hideLoading,
// //     updateProgress,
// //     clearLoading: clear,
// //   };
// // };

// // Higher-order function for automatic loading management
// // export const withLoading = <T extends any[], R>(
// //   asyncFn: (...args: T) => Promise<R>,
// //   loadingType: LoadingType = 'default',
// //   loadingMessage?: string
// // ) => {
// //   return async (dispatch: any, ...args: T): Promise<R> => {
// //     try {
// //       dispatch(setLoading({ 
// //         isLoading: true, 
// //         loadingType, 
// //         loadingMessage 
// //       }));
      
// //       const result = await asyncFn(...args);
// //       return result;
// //     } finally {
// //       dispatch(setLoading({ isLoading: false }));
// //     }
// //   };
// // };

// // Utility for progress-based operations
// export const withProgressLoading = <T extends any[], R>(
//   asyncFn: (progressCallback: (progress: number, message?: string) => void, ...args: T) => Promise<R>,
//   loadingType: LoadingType = 'default',
//   initialMessage?: string
// ) => {
//   return async (dispatch: any, ...args: T): Promise<R> => {
//     try {
//       dispatch(setLoading({ 
//         isLoading: true, 
//         loadingType, 
//         loadingMessage: initialMessage,
//         progress: 0
//       }));
      
//       const progressCallback = (progress: number, message?: string) => {
//         dispatch(updateLoadingProgress({ progress, message }));
//       };
      
//       const result = await asyncFn(progressCallback, ...args);
//       return result;
//     } finally {
//       dispatch(setLoading({ isLoading: false }));
//     }
//   };
// };