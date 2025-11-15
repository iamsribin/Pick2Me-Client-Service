import SocketService from "../services/socketService";
import { rideLocationReceived } from "../services/redux/slices/rideSlice";
import { store } from "../services/redux/store";

let latestPos: any = null;
let flushTimer: number | null = null;

const flush = () => {
  if (latestPos) {
    store.dispatch(rideLocationReceived(latestPos));
    latestPos = null;
  }
  if (flushTimer) {
    window.clearTimeout(flushTimer);
    flushTimer = null;
  }
};

export const socketMiddleware = () => (next:any) => (action:any) => {
  if (action.type === "socket/emit") {
    const { event, data } = action.payload;
    SocketService.emit(event, data);
  }
  return next(action);
};

// export const socketMiddleware = () => {
//   SocketService.registerEventHandler((ev) => {
//     if (ev.type === "driver.location") {
//       latestPos = ev.payload; // keep newest
//       if (!flushTimer) {
//         flushTimer = window.setTimeout(flush, 200); // 5Hz
//       }
//       return;
//     }
//     switch (ev.type) {
//       case 'notification':
//         store.dispatch(notificationReceived(ev.payload));
//         break;
//       case 'ride.status':
//         // storeAPI.dispatch(rideStatusReceived(ev.payload));
//         break;
//       default:
//         console.warn('unknown', ev);
//     }
//   });

//   return (next: any) => (action: any) => {
//     // allow actions to trigger socket sends
//     if (action.type === "socket/emit") {
//       SocketService.emit(action.payload.event, action.payload.data);
//     }
//     return next(action);
//   };
// };
