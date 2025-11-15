// import { useCallback } from "react";
// import {
//   showNotification,
//   hideNotification,
// } from "../services/redux/slices/notificationSlice";
// import { useDispatch } from "react-redux";

// export const useNotification = () => {
//   const dispatch = useDispatch();
//   const onNotification = useCallback(
//     (
//       type:
//         | "info"
//         | "alert"
//         | "ride-accepted"
//         | "admin-blocked"
//         | "success"
//         | "error",
//       message: string,
//       data?: string,
//       navigate?: string
//     ) => {
//       dispatch(
//         showNotification({
//           type,
//           message,
//           data,
//           navigate,
//         })
//       );
//     },
//     [dispatch]
//   );

//   const offNotification = useCallback(() => {
//     dispatch(hideNotification());
//   }, [dispatch]);

//   return { onNotification, offNotification };
// };
