import { useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "@/context/socket-context";
import { Message } from "@/shared/types/common";

interface UseChatProps {
  rideId: string;
  currentUser: "driver" | "user";
  recipientId: string;
  onReceiveMessage: (message: Message) => void;
  onUnreadCountChange?: (count: number) => void;
  isActiveSection?: boolean;
}

interface ChatState {
  isTyping: boolean;
  isRecipientTyping: boolean;
  connectionStatus: "connected" | "disconnected" | "connecting";
}

export const useChat = ({
  rideId,
  currentUser,
  recipientId,
  onReceiveMessage,
  onUnreadCountChange,
  isActiveSection = true,
}: UseChatProps) => {
  const { socket, isConnected } = useSocket();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [chatState, setChatState] = useState<ChatState>({
    isTyping: false,
    isRecipientTyping: false,
    connectionStatus: "disconnected",
  });

  // Update connection status
  useEffect(() => {
    setChatState(prev => ({
      ...prev,
      connectionStatus: isConnected ? "connected" : "disconnected",
    }));
  }, [isConnected]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleReceiveMessage = (data: {
      sender: "driver" | "user";
      message: string;
      timestamp: string;
      type: "text" | "image";
      fileUrl?: string;
    }) => {
      const message: Message = {
        sender: data.sender,
        content: data.message,
        timestamp: data.timestamp,
        type: data.type,
        fileUrl: data.fileUrl,
      };
      
      onReceiveMessage(message);
      
      // Handle unread count
      if (!isActiveSection && onUnreadCountChange && data.sender !== currentUser) {
        onUnreadCountChange(1);
      }
    };

    const handleTypingIndicator = (data: { isTyping: boolean; rideId: string }) => {
      if (data.rideId === rideId) {
        setChatState(prev => ({
          ...prev,
          isRecipientTyping: data.isTyping,
        }));
      }
    };

    // Setup appropriate event listeners based on user type
    socket.on("receiveMessage", handleReceiveMessage);
    
    if (currentUser === "driver") {
      socket.on("userTyping", handleTypingIndicator);
    } else {
      socket.on("driverTyping", handleTypingIndicator);
    }

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off(currentUser === "driver" ? "userTyping" : "driverTyping", handleTypingIndicator);
    };
  }, [socket, isConnected, rideId, currentUser, onReceiveMessage, isActiveSection, onUnreadCountChange]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!socket || !isConnected) return;

    const eventData = {
      rideId,
      sender: currentUser,
      isTyping,
      ...(currentUser === "driver" ? { userId: recipientId } : { driverId: recipientId }),
    };

    socket.emit("typing", eventData);
  }, [socket, isConnected, rideId, currentUser, recipientId]);

  // Handle typing with debounce
  const handleTyping = useCallback(() => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing start
    sendTypingIndicator(true);
    setChatState(prev => ({ ...prev, isTyping: true }));

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false);
      setChatState(prev => ({ ...prev, isTyping: false }));
    }, 1500);
  }, [sendTypingIndicator]);

  // Send message
  const sendMessage = useCallback((content: string, type: "text" | "image" = "text", fileUrl?: string) => {
    if (!socket || !isConnected || (!content.trim() && type === "text")) return false;

    // Clear typing timeout and indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTypingIndicator(false);
    setChatState(prev => ({ ...prev, isTyping: false }));

    const timestamp = new Date().toISOString();
    const message: Message = {
      sender: currentUser,
      content: content.trim(),
      timestamp,
      type,
      fileUrl,
    };

    // Send via socket
    const eventData = {
      rideId,
      sender: currentUser,
      message: content.trim(),
      timestamp,
      type,
      fileUrl,
      ...(currentUser === "driver" ? { userId: recipientId } : { driverId: recipientId }),
    };

    socket.emit("sendMessage", eventData);
    
    // Call onReceiveMessage to update local state immediately
    onReceiveMessage(message);
    
    return true;
  }, [socket, isConnected, rideId, currentUser, recipientId, sendTypingIndicator, onReceiveMessage]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Send stop typing on unmount
      if (socket && isConnected && chatState.isTyping) {
        sendTypingIndicator(false);
      }
    };
  }, [socket, isConnected, chatState.isTyping, sendTypingIndicator]);

  return {
    sendMessage,
    handleTyping,
    isRecipientTyping: chatState.isRecipientTyping,
    isConnected: chatState.connectionStatus === "connected",
    connectionStatus: chatState.connectionStatus,
  };
};