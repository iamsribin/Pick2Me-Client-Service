import { useEffect } from "react";
import SocketService from "@/shared/services/socketService";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../services/redux/store";
import { toast } from "./use-toast";

export function useAdminSocketEvents() {
    const dispatch = useDispatch();

    const user = useSelector((state: RootState) => state.user);

    useEffect(() => {
        console.log(user);
        
        if (user.role !== "Admin") return;
        SocketService.connect();

        const offNotification = SocketService.on("issue:created", (data) => {
            console.log(" issue:created", data);
        });

        const offError = SocketService.on("error", (data) => {
            toast({ description: data.message, variant: "error" });
        });

        return () => {
            offNotification();
            offError();
        };
    }, [dispatch, user.role]);
}
