import React, { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Send, Wifi, WifiOff } from "lucide-react";
import { addChatMessage } from "@/shared/services/redux/slices/driverRideSlice";
import ImageCapture from "./ImageCapture";
import { Message } from "@/shared/types/common";
import { RideRequest } from "@/shared/types/driver/ride-type";
import { useChat } from "@/shared/hooks/useChat"; 
import { toast } from "sonner";

interface ChatSectionProps {
  rideData: RideRequest;
  setUnreadCount: (count: number) => void;
}

const TypingIndicator: React.FC<{ isTyping: boolean; userName: string }> = ({ 
  isTyping, 
  userName 
}) => {
  if (!isTyping) return null;

  return (
    <div className="flex justify-start">
      <div className="bg-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm">
        <div className="flex items-center space-x-2">
          <span>{userName} is typing</span>
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ConnectionStatus: React.FC<{ status: "connected" | "disconnected" | "connecting" }> = ({ 
  status 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case "connected":
        return { icon: Wifi, color: "text-green-500", text: "Connected" };
      case "connecting":
        return { icon: Wifi, color: "text-yellow-500", text: "Connecting..." };
      default:
        return { icon: WifiOff, color: "text-red-500", text: "Disconnected" };
    }
  };

  const { icon: Icon, color, text } = getStatusConfig();

  return (
    <div className={`flex items-center gap-1 text-xs ${color}`}>
      <Icon className="h-3 w-3" />
      <span>{text}</span>
    </div>
  );
};

const MessageBubble: React.FC<{ message: Message; isOwn: boolean }> = ({ 
  message, 
  isOwn 
}) => {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[70%]">
        {message.type === "text" && (
          <div
            className={`p-3 rounded-lg text-sm ${
              isOwn
                ? "bg-blue-500 text-white rounded-br-sm"
                : "bg-gray-200 text-gray-800 rounded-bl-sm"
            }`}
          >
            <p className="break-words whitespace-pre-wrap">{message.content}</p>
            <p
              className={`text-xs mt-1 ${
                isOwn ? "text-blue-100" : "text-gray-500"
              }`}
            >
              {formatTime(message.timestamp)}
            </p>
          </div>
        )}
        
        {message.type === "image" && message.fileUrl && (
          <div className="rounded-lg overflow-hidden">
            <img
              src={message.fileUrl}
              alt="Shared content"
              className="max-w-[200px] h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.fileUrl, "_blank")}
              loading="lazy"
            />
            <p
              className={`text-xs mt-1 text-right ${
                isOwn ? "text-blue-500" : "text-gray-500"
              }`}
            >
              {formatTime(message.timestamp)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const  ChatSection: React.FC<ChatSectionProps> = ({ rideData, setUnreadCount }) => {
  const dispatch = useDispatch();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [messageInput, setMessageInput] = useState<string>("");

  // Handle message receipt and dispatch to Redux store
  const handleReceiveMessage = useCallback((message: Message) => {
    dispatch(
      addChatMessage({
        bookingId: rideData.bookingDetails.bookingId,
        message,
      })
    );
  }, [dispatch, rideData]);

  // Handle unread count changes
  const handleUnreadCountChange = useCallback((increment: number) => {
    setUnreadCount((prev: number) => prev + increment);
  }, [setUnreadCount]);

  // Use the custom chat hook
  const { 
    sendMessage, 
    handleTyping, 
    isRecipientTyping, 
    isConnected, 
    connectionStatus 
  } = useChat({
    rideId: rideData.bookingDetails.rideId,
    currentUser: "driver",
    recipientId: rideData.customer.userId,
    onReceiveMessage: handleReceiveMessage,
    onUnreadCountChange: handleUnreadCountChange,
    isActiveSection: true, // Assuming this is always active when rendered
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (rideData?.chatMessages && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [rideData?.chatMessages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    if (e.target.value.trim()) {
      handleTyping();
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const success = sendMessage(messageInput);
    if (success) {
      setMessageInput("");
    } else {
      toast.error("Failed to send message. Please check your connection.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && messageInput.trim()) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">Chat with Customer</h3>
        <ConnectionStatus status={connectionStatus} />
      </div>

      
      {/* Messages Container */}
      <div className="h-40 sm:h-48 overflow-y-auto bg-gray-50 rounded-lg p-3 space-y-3 scroll-smooth">
        {(!rideData.chatMessages || rideData.chatMessages.length === 0) ? (
          <div className="text-center text-gray-500 text-sm py-8">
            <p>No messages yet.</p>
            <p className="text-xs mt-1">Start a conversation with your customer!</p>
          </div>
        ) : (
          rideData.chatMessages.map((message: Message, index: number) => (
            <MessageBubble
              key={`${message.timestamp}-${index}`}
              message={message}
              isOwn={message.sender === "driver"}
            />
          ))
        )}
        
        {/* Typing Indicator */}
        <TypingIndicator 
          isTyping={isRecipientTyping} 
          userName="Customer" 
        />
        
        <div ref={chatEndRef} />
      </div>
      
      {/* Input Section */}
      <div className="flex gap-2">
        <Input
          value={messageInput}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 h-10"
          disabled={!isConnected}
          maxLength={500}
        />
        <Button
          onClick={handleSendMessage}
          className="h-10 bg-green-600 hover:bg-green-700 disabled:opacity-50"
          disabled={!messageInput.trim() || !isConnected}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
              <ImageCapture rideData={rideData} />

      </div>
      
      {/* Character count */}
      {messageInput.length > 400 && (
        <p className="text-xs text-gray-500 text-right">
          {messageInput.length}/500
        </p>
      )}
    </div>
  );
};

export default ChatSection;