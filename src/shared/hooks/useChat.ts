// src/components/driver/hooks/useChat.ts
import { useState, useRef, useEffect } from "react";
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

const useChat = (rideDetails: RideDetails, rideId: string, status: string) => {
  const dispatch = useDispatch();
  const messages = useSelector(
    (state: RootState) => state.RideData.chat[rideId || ""] ?? []
  );
  const unreadCount = useSelector(
    (state: RootState) => state.RideData.unreadCounts[rideId || ""] ?? 0
  );

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [userIsTyping, setUserIsTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket listeners for chat
  useEffect(() => {
    const handleIncomingMessage = (data: any) => {
      const msg: ChatMessage = {
        id: data.id,
        text: data.text || "",
        image: data.image,
        sender: "user",
        time: data.time,
        edited: data.edited,
        deleted: data.deleted,
      };
      dispatch(addMessage({ rideId, message: msg }));
    };

    const handleTyping = (data: { isTyping: boolean }) => {
      setUserIsTyping(data.isTyping);
    };

    const handleEdit = (data: { messageId: string; newText: string }) => {
      dispatch(
        editMessage({
          rideId,
          messageId: data.messageId,
          newText: data.newText,
        })
      );
    };

    const handleDelete = (data: { messageId: string }) => {
      dispatch(deleteMessage({ rideId, messageId: data.messageId }));
    };

    const offMessage = socketService.on("send:message", handleIncomingMessage);
    const offImage = socketService.on("send:image", handleIncomingMessage);
    const offTyping = socketService.on("chat:typing", handleTyping);
    const offEdit = socketService.on("chat:edit", handleEdit);
    const offDelete = socketService.on("chat:delete", handleDelete);

    return () => {
      offMessage();
      offImage();
      offTyping();
      offEdit();
      offDelete();
    };
  }, [dispatch, rideId]);

  const openChat = () => {
    setIsChatOpen(true);
    dispatch(markChatAsRead(rideId));
  };

  const handleTypingChange = (value: string) => {
    setMessageInput(value);
    if (!isTyping) {
      setIsTyping(true);
      dispatch(
        emitSocket("chat:typing", {
          receiver: rideDetails.user?.userId,
          isTyping: true,
        })
      );
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      dispatch(
        emitSocket("chat:typing", {
          receiver: rideDetails.user?.userId,
          isTyping: false,
        })
      );
    }, 1000);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const messageId = uuidv4();
    const message: ChatMessage = {
      id: messageId,
      text: messageInput,
      sender: "driver",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    dispatch(addMessage({ rideId, message }));
    dispatch(
      emitSocket("send:message", {
        ...message,
        receiver: rideDetails.user?.userId,
        rideId,
      })
    );

    setMessageInput("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const messageId = uuidv4();
      const message: ChatMessage = {
        id: messageId,
        text: "",
        image: reader.result as string,
        sender: "driver",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      dispatch(addMessage({ rideId, message }));
      dispatch(
        emitSocket("send:image", {
          ...message,
          receiver: rideDetails.user?.userId,
          rideId,
        })
      );
    };
    reader.readAsDataURL(file);
  };

  const handleEditMessage = (msg: ChatMessage) => {
    const newText = prompt("Edit message:", msg.text);
    if (newText && newText.trim() && newText !== msg.text) {
      dispatch(
        editMessage({ rideId, messageId: msg.id, newText: newText.trim() })
      );
      dispatch(
        emitSocket("chat:edit", {
          receiver: rideDetails.user?.userId,
          messageId: msg.id,
          newText: newText.trim(),
        })
      );
    }
  };

  const handleDeleteMessage = (msg: ChatMessage) => {
    if (confirm("Delete this message?")) {
      dispatch(deleteMessage({ rideId, messageId: msg.id }));
      dispatch(
        emitSocket("chat:delete", {
          receiver: rideDetails.user?.userId,
          messageId: msg.id,
        })
      );
    }
  };

  return {
    isChatOpen,
    setIsChatOpen,
    messages,
    unreadCount,
    messageInput,
    userIsTyping,
    openChat,
    handleTypingChange,
    handleSendMessage,
    handleImageUpload,
    handleEditMessage,
    handleDeleteMessage,
  };
};

export default useChat;