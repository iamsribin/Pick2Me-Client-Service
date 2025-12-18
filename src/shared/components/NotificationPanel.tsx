import React, { useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Bell, X, Trash2, CheckCheck, Check } from "lucide-react";
import { RootState } from "@/shared/services/redux/store";
import {
  markRead,
  clearNotification,
  clearAllNotifications,
  markAllAsRead,
} from "@/shared/services/redux/slices/notificationSlice";
import { formatTimestamp } from "@/shared/utils/format";
import { deleteData, patchData } from "@/shared/services/api/api-service";
import { CommonApiEndPoint } from "@/constants/common-api-ent-point";
import { toast } from "@/shared/hooks/use-toast";
import { handleCustomError } from "@/shared/utils/error";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
  position?: "left" | "right"; // Add position prop for alignment
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  isMobile = false,
  position = "right", // Default to right for driver side
}) => {
  const dispatch = useDispatch();
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const notifications = useSelector(
    (state: RootState) => state.notification.items
  );

  const unreadNotifications = notifications.filter((n) => !n.read);

  const displayNotifications = notifications;
  const hasMore = false;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node | null;
      if (
        notificationRef.current &&
        targetNode &&
        !notificationRef.current.contains(targetNode) &&
        !isMobile
      ) {
        onClose();
      }
    };

    if (isOpen && !isMobile) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, isMobile]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await patchData(
        CommonApiEndPoint.MARK_AS_READ.replace(":id", notificationId),
        {}
      );
      if (response?.status === 200) {
        dispatch(markRead(notificationId));
      }
      toast({ description: "notification marked as read", variant: "success" });
    } catch (error) {
      handleCustomError(error);
    }
  };

  const handleClearNotification = async (notificationId: string) => {
    try {
      const response = await deleteData(
        CommonApiEndPoint.CLEAR_NOTIFICATION.replace(":id", notificationId)
      );
      if (response?.status === 200) {
        dispatch(clearNotification(notificationId));
      }
      toast({ description: "notification cleared successfully" });
    } catch (error) {
      handleCustomError(error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await patchData(CommonApiEndPoint.MARK_ALL_AS_READ, {});
      if (response?.status === 200) {
        dispatch(markAllAsRead());
      }
      toast({
        description: "Everything was marked as read successfully.",
      });
    } catch (error) {
      handleCustomError(error);
    }
  };

  const handleClearAll = async () => {
    try {
      const response = await deleteData(
        CommonApiEndPoint.CLEAR_ALL_NOTIFICATION
      );
      if (response?.status === 200) {
        dispatch(clearAllNotifications());
        onClose();
      }
      toast({ description: "cleared all notification successfully" });
    } catch (error) {
      handleCustomError(error);
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    onClose();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "payment":
        return "bg-[#fdb726]/20 text-[#fdb726]";
      case "ride":
        return "bg-[#fdb726]/30 text-[#000000]";
      case "system":
      default:
        return "bg-[#e8c58c] text-[#000000]";
    }
  };

  if (!isOpen) return null;

  // Desktop View
  if (!isMobile) {
    return (
      <div
        ref={notificationRef}
        className={`absolute ${
          position === "left" ? "right-0" : "left-0"
        } top-full mt-2 w-96 bg-gradient-to-b from-[#ffffff] to-[#e8c58c]/20 rounded-2xl shadow-2xl border-2 border-[#fdb726]/30 overflow-hidden z-50`}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#fdb726] to-[#f5a623] border-b-2 border-[#000000]/10">
          <h3 className="font-bold text-[#000000] text-base">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadNotifications.length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="p-1.5 hover:bg-[#000000]/10 rounded-full transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4 text-[#000000]" />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="p-1.5 hover:bg-[#000000]/10 rounded-full transition-colors"
                title="Clear all"
              >
                <Trash2 className="h-4 w-4 text-[#000000]" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#000000]/10 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-[#000000]" />
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto bg-white">
          {displayNotifications.length > 0 ? (
            displayNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`group px-5 py-4 border-b border-[#fdb726]/20 hover:bg-[#e8c58c]/30 cursor-pointer transition-all duration-200 ${
                  !notification.read
                    ? "bg-[#fdb726]/10 hover:bg-[#fdb726]/20"
                    : ""
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div
                    onClick={() => handleNotificationClick(notification)}
                    className="flex items-start space-x-3 flex-1 min-w-0"
                  >
                    <div
                      className={`p-2.5 rounded-lg ${getNotificationIcon(
                        notification.type
                      )} flex-shrink-0`}
                    >
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-[#000000]">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-[#fdb726] rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-[#000000]/70 mt-1 line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="text-xs text-[#000000]/50 mt-1.5 font-medium">
                        {formatTimestamp(notification.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        className="p-1.5 hover:bg-[#fdb726]/20 rounded-full transition-colors"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5 text-[#000000]" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearNotification(notification.id);
                      }}
                      className="p-1.5 hover:bg-red-500/20 rounded-full transition-colors"
                      title="Clear"
                    >
                      <X className="h-3.5 w-3.5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-5 py-8 text-center text-[#000000]/50">
              <Bell className="h-12 w-12 mx-auto mb-3 text-[#000000]/30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          )}
        </div>

        {hasMore && (
          <button
            onClick={onClose}
            className="w-full px-5 py-3.5 text-center text-sm font-bold text-[#000000] hover:bg-[#fdb726]/20 transition-colors border-t-2 border-[#fdb726]/30"
          >
            See All Notifications
          </button>
        )}
      </div>
    );
  }

  // Mobile View
  return (
    <div
      className="fixed inset-0 bg-[#000000]/70 z-40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="fixed bottom-16 left-0 right-0 bg-gradient-to-b from-[#ffffff] to-[#e8c58c]/30 rounded-t-3xl shadow-2xl max-h-[80vh] overflow-hidden border-t-4 border-[#fdb726]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#fdb726] to-[#f5a623] border-b-2 border-[#000000]/10">
          <h3 className="font-bold text-[#000000] text-base">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadNotifications.length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="p-1.5 hover:bg-[#000000]/10 rounded-full transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="h-5 w-5 text-[#000000]" />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="p-1.5 hover:bg-[#000000]/10 rounded-full transition-colors"
                title="Clear all"
              >
                <Trash2 className="h-5 w-5 text-[#000000]" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#000000]/10 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-[#000000]" />
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {displayNotifications.length > 0 ? (
            displayNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-5 py-4 border-b border-[#fdb726]/20 active:bg-[#e8c58c]/50 transition-colors ${
                  !notification.read ? "bg-[#fdb726]/10" : ""
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div
                    onClick={() => handleNotificationClick(notification)}
                    className="flex items-start space-x-3 flex-1 min-w-0"
                  >
                    <div
                      className={`p-2.5 rounded-lg ${getNotificationIcon(
                        notification.type
                      )} flex-shrink-0`}
                    >
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-[#000000]">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-[#fdb726] rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-[#000000]/70 mt-1">
                        {notification.body}
                      </p>
                      <p className="text-xs text-[#000000]/50 mt-1.5 font-medium">
                        {formatTimestamp(notification.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        className="p-2 hover:bg-[#fdb726]/20 rounded-full transition-colors"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4 text-[#000000]" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearNotification(notification.id);
                      }}
                      className="p-2 hover:bg-red-500/20 rounded-full transition-colors"
                      title="Clear"
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-5 py-8 text-center text-[#000000]/50">
              <Bell className="h-12 w-12 mx-auto mb-3 text-[#000000]/30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          )}
        </div>

        {hasMore && (
          <button
            onClick={onClose}
            className="w-full px-5 py-3.5 text-center text-sm font-bold text-[#000000] active:bg-[#fdb726]/20 transition-colors border-t-2 border-[#fdb726]/30"
          >
            See All Notifications
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
