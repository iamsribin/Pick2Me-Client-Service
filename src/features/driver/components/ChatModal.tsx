import React, { useRef } from "react";
import { X, Send, ImagePlus } from "lucide-react";
import { ChatMessage } from "@/shared/services/redux/slices/rideSlice";
import { RideDetails } from "@/shared/types/common";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  messageInput: string;
  userIsTyping: boolean;
  rideDetails: RideDetails;
  onTypingChange: (value: string) => void;
  onSendMessage: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditMessage: (msg: ChatMessage) => void;
  onDeleteMessage: (msg: ChatMessage) => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  messages,
  messageInput,
  userIsTyping,
  rideDetails,
  onTypingChange,
  onSendMessage,
  onImageUpload,
  onEditMessage,
  onDeleteMessage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center sm:justify-center">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl h-[80vh] sm:h-[600px] flex flex-col border-2 border-yellow-500 shadow-2xl">
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={
                rideDetails.user?.userProfile ||
                "/images/default-avatar.png"
              }
              alt="User"
              className="w-10 h-10 rounded-full border-2 border-white"
            />
            <div>
              <h3 className="text-white font-bold">
                {rideDetails.user?.userName}
              </h3>
              <p className="text-white/80 text-xs">
                {userIsTyping ? "Typing..." : "Online"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-white/80 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-yellow-50" ref={chatEndRef}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "driver" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-2xl p-3 ${
                  msg.sender === "driver"
                    ? "bg-yellow-500 text-black"
                    : "bg-gray-800 text-white"
                }`}
              >
                {msg.deleted ? (
                  <p className="italic text-gray-500">
                    This message was deleted
                  </p>
                ) : (
                  <>
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="Sent"
                        className="rounded-lg mb-2 max-w-full"
                      />
                    )}
                    {msg.text && <p className="text-sm">{msg.text}</p>}
                    <p
                      className={`text-xs mt-1 ${
                        msg.sender === "driver"
                          ? "text-black/70"
                          : "text-gray-400"
                      }`}
                    >
                      {msg.time} {msg.edited && "(edited)"}
                    </p>
                  </>
                )}

                {!msg.deleted && msg.sender === "driver" && (
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditMessage(msg);
                      }}
                      className="text-xs bg-black/20 hover:bg-black/30 px-2 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteMessage(msg);
                      }}
                      className="text-xs bg-red-500/30 hover:bg-red-500/50 px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-4 border-t-2 border-yellow-500">
          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={onImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-yellow-100 hover:bg-yellow-200 p-2 rounded-full transition-colors"
            >
              <ImagePlus className="text-yellow-600" size={20} />
            </button>
            <input
              type="text"
              value={messageInput}
              onChange={(e) => onTypingChange(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && onSendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-yellow-50 text-gray-900 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 border border-yellow-300"
            />
            <button
              onClick={onSendMessage}
              className="bg-yellow-500 hover:bg-yellow-600 p-2 rounded-full transition-colors shadow-lg"
            >
              <Send className="text-white" size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};