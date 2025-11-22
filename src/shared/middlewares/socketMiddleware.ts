import SocketService from "../services/socketService";

export const socketMiddleware = () => (next:any) => (action:any) => {
  if (action.type === "socket/emit") {
    console.log("Emitting socket event:", action.payload.event, action.payload.data);
    const { event, data } = action.payload;
    SocketService.emit(event, data);
  }
  return next(action);
};
