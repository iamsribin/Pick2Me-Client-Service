import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { RootState } from "@/shared/services/redux/store";
import {
  addMessage,
  ChatMessage,
  deleteMessage,
  editMessage,
  markChatAsRead,
} from "@/shared/services/redux/slices/rideSlice";
import { emitSocket } from "@/shared/utils/emitSocket";
import socketService from "@/shared/services/socketService";
import { RideDetails } from "../types/common";
import { toast } from "@/shared/hooks/use-toast";

const useChat = (rideDetails: RideDetails, rideId: string) => {
  const dispatch = useDispatch();
  
  const messages = useSelector(
    (state: RootState) => state.RideData.chat[rideId || ""] ?? []
  );
  const unreadCount = useSelector(
    (state: RootState) => state.RideData.unreadCounts[rideId || ""] ?? 0
  );
  const currentUserRole = useSelector(
    (state: RootState) => state.user.role
  );

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [remoteUserIsTyping, setRemoteUserIsTyping] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isLocalTypingRef = useRef(false);

  const messageNotificationRef = useRef<HTMLAudioElement>(null);

  const receiverId = useMemo(() => {
    const roleNormalized = currentUserRole?.toLowerCase();
    if (roleNormalized === "user") {
      return rideDetails.driver?.driverId;
    } else if (roleNormalized === "driver") {
      return rideDetails.user?.userId;
    }
    return null;
  }, [currentUserRole, rideDetails]);

  const senderRole = currentUserRole?.toLowerCase() as "user" | "driver";

  const playMessageNotification = useCallback(() => {
    if (messageNotificationRef.current) {
      messageNotificationRef.current.src = '/message_tune.mp3'; 
      messageNotificationRef.current.volume = 0.7; 
      messageNotificationRef.current.play().catch((error) => {
        console.warn('Could not play message notification:', error);
      });
    }
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpen]);

  useEffect(() => {
    if (!rideId) return;

    const handleIncomingMessage = (data: any) => {
      if (data.sender === senderRole) return; 

      const msg: ChatMessage = {
        id: data.id,
        text: data.text || "",
        image: data.image,
        sender: data.sender, 
        time: data.time,
        edited: data.edited,
        deleted: data.deleted,
      };
      dispatch(addMessage({ rideId, message: msg }));

      playMessageNotification();
    };

    const handleTyping = (data: { isTyping: boolean }) => {
      setRemoteUserIsTyping(data.isTyping);
    };

    const handleEdit = (data: { messageId: string; newText: string }) => {
      dispatch(editMessage({ rideId, messageId: data.messageId, newText: data.newText }));
    };

    const handleDelete = (data: { messageId: string }) => {
      dispatch(deleteMessage({ rideId, messageId: data.messageId }));
    };

    const listeners = [
      socketService.on("send:message", handleIncomingMessage),
      socketService.on("send:image", handleIncomingMessage),
      socketService.on("chat:typing", handleTyping),
      socketService.on("chat:edit", handleEdit),
      socketService.on("chat:delete", handleDelete),
    ];

    return () => {
      listeners.forEach((unsubscribe) => unsubscribe && unsubscribe());
    };
  }, [dispatch, rideId, senderRole, playMessageNotification]);

  
  const openChat = useCallback(() => {
    setIsChatOpen(true);
    dispatch(markChatAsRead(rideId));
  }, [dispatch, rideId]);

  const handleTypingChange = useCallback((value: string) => {
    setMessageInput(value);
    
    if (!receiverId) return;

    if (!isLocalTypingRef.current) {
      isLocalTypingRef.current = true;
      dispatch(emitSocket("chat:typing", { receiver: receiverId, isTyping: true }));
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      isLocalTypingRef.current = false;
      dispatch(emitSocket("chat:typing", { receiver: receiverId, isTyping: false }));
    }, 1000);
  }, [dispatch, receiverId]);

  const handleSendMessage = useCallback(() => {
    if (!messageInput.trim() || !receiverId) return;

    const messageId = uuidv4();
    const message: ChatMessage = {
      id: messageId,
      text: messageInput.trim(),
      sender: senderRole,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    dispatch(addMessage({ rideId, message }));
    
    dispatch(emitSocket("send:message", {
      ...message,
      receiver: receiverId,
      rideId,
    }));

    setMessageInput("");
  }, [messageInput, receiverId, senderRole, rideId, dispatch]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !receiverId) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const messageId = uuidv4();
      const message: ChatMessage = {
        id: messageId,
        text: "",
        image: reader.result as string,
        sender: senderRole,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      dispatch(addMessage({ rideId, message }));
      dispatch(emitSocket("send:image", {
        ...message,
        receiver: receiverId,
        rideId,
      }));
    };
    reader.readAsDataURL(file);
  }, [receiverId, senderRole, rideId, dispatch]);

  const handleEditMessage = useCallback((msg: ChatMessage) => {
    const newText = prompt("Edit message:", msg.text);
    if (newText && newText.trim() && newText !== msg.text && receiverId) {
      const trimmedText = newText.trim();
      dispatch(editMessage({ rideId, messageId: msg.id, newText: trimmedText }));
      dispatch(emitSocket("chat:edit", {
        receiver: receiverId,
        messageId: msg.id,
        newText: trimmedText,
      }));
    }
  }, [rideId, receiverId, dispatch]);

  const handleDeleteMessage = useCallback((msg: ChatMessage) => {
    if (confirm("Delete this message?") && receiverId) {
      dispatch(deleteMessage({ rideId, messageId: msg.id }));
      dispatch(emitSocket("chat:delete", {
        receiver: receiverId,
        messageId: msg.id,
      }));
    }
  }, [rideId, receiverId, dispatch]);

  return {
    isChatOpen,
    setIsChatOpen,
    messages,
    unreadCount,
    messageInput,
    remoteUserIsTyping,
    openChat,
    handleTypingChange,
    handleSendMessage,
    handleImageUpload,
    handleEditMessage,
    handleDeleteMessage,
    chatEndRef,
    messageNotificationRef 
  };
};

export default useChat;