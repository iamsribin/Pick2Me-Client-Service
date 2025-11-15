import React, { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import {
  User,
  Wallet,
  MapPin,
  FileText,
  LogOut,
  LayoutDashboard,
  Bell,
  Navigation,
  AlertCircle,
  X,
} from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/shared/components/ui/navigation-menu";
import { RootState } from "@/shared/services/redux/store";
import { useSelector } from "react-redux";
import { handleLogout } from "@/shared/utils/auth";

const DriverNavbar = () => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isPulsing, setIsPulsing] = useState(true);
  const notificationRef = useRef<HTMLDivElement | null>(null);

  // const rideData = useSelector((state: RootState) => state.driverRideMap);

  const [notifications] = useState([
    {
      id: "1",
      title: "New Ride Request",
      message: "You have a new ride request from downtown area",
      timestamp: "2 min ago",
      type: "info",
      isRead: false,
    },
    {
      id: "2",
      title: "Payment Received",
      message: "₹450 has been credited to your wallet",
      timestamp: "15 min ago",
      type: "success",
      isRead: false,
    },
    {
      id: "3",
      title: "Document Expiring",
      message: "Your driver's license will expire in 30 days",
      timestamp: "1 hour ago",
      type: "warning",
      isRead: true,
    },
    {
      id: "4",
      title: "Weekly Earnings",
      message: "You've earned ₹12,500 this week. Great job!",
      timestamp: "3 hours ago",
      type: "success",
      isRead: true,
    },
    {
      id: "5",
      title: "Rating Update",
      message: "Your rating has improved to 4.8 stars",
      timestamp: "5 hours ago",
      type: "info",
      isRead: true,
    },
    {
      id: "6",
      title: "Bonus Alert",
      message: "Complete 5 more rides to unlock ₹500 bonus",
      timestamp: "1 day ago",
      type: "info",
      isRead: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const displayNotifications = notifications.slice(0, 5);
  const hasMore = notifications.length > 5;
  const rideData = {
    paymentStatus: "pending",
    isOpen: false,
  };
  const isPaymentPending =
    rideData.paymentStatus === "pending" || rideData.paymentStatus === "failed";

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (rideData) {
      interval = setInterval(() => {
        setIsPulsing((prev) => !prev);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [rideData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node | null;
      if (
        notificationRef.current &&
        targetNode &&
        !notificationRef.current.contains(targetNode)
      ) {
        setIsNotificationOpen(false);
      }
    };

    if (isNotificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationOpen]);

  const logoutHandle = () => {
    handleLogout();
  };

  const handleRideMapNavigation = () => {
    console.log("Navigate to ride tracking");
  };

  const handlePaymentNavigation = () => {
    console.log("Navigate to payment");
  };

  const handleNotificationClick = (notificationId: string) => {
    console.log("Notification clicked:", notificationId);
    setIsNotificationOpen(false);
  };

  const handleSeeAllNotifications = () => {
    console.log("See all notifications");
    setIsNotificationOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return "bg-[#fdb726]/20 text-[#fdb726]";
      case "warning":
        return "bg-[#fdb726]/30 text-[#000000]";
      default:
        return "bg-[#e8c58c] text-[#000000]";
    }
  };

  const linkStyles = (isActive: boolean) => `
    flex items-center p-4 w-full rounded-xl transition-all duration-300 font-medium
    ${
      isActive
        ? "bg-gradient-to-r from-[#fdb726] to-[#f5a623] text-[#000000] font-bold shadow-lg scale-105"
        : "hover:bg-[#e8c58c]/30 text-[#000000]/80 hover:text-[#000000] hover:shadow-md"
    }
  `;

  return (
    <>
      {/* Status Bar - Desktop View */}
      {(rideData.isOpen || isPaymentPending) && (
        <div className="hidden sm:block fixed top-4 right-6 z-30">
          {isPaymentPending ? (
            <button
              onClick={handlePaymentNavigation}
              className="flex items-center space-x-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#fdb726] to-[#f5a623] hover:from-[#f5a623] hover:to-[#fdb726] font-bold text-sm transition-all duration-300 shadow-xl hover:scale-110 border-2 border-black/10"
            >
              <AlertCircle size={18} className="text-black" />
              <span className="text-black">
                {rideData?.paymentStatus === "failed"
                  ? "Payment Failed"
                  : "Payment Pending"}
              </span>
            </button>
          ) : (
            <button
              onClick={handleRideMapNavigation}
              className={`flex items-center space-x-2 px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 border-2 ${
                isPulsing
                  ? "bg-[#fdb726] shadow-2xl shadow-[#fdb726]/50 scale-110 border-black/20"
                  : "bg-[#f5a623] shadow-lg scale-100 border-black/10"
              }`}
            >
              <Navigation size={18} className="text-black" />
              <span className="text-black">Go to Ride Map</span>
              <span
                className={`w-3 h-3 rounded-full ml-1 ${
                  isPulsing ? "bg-black shadow-lg" : "bg-black/50"
                } transition-all duration-300`}
              />
            </button>
          )}
        </div>
      )}

      {/* Main Sidebar */}
      <div className="fixed bottom-0 left-0 right-0 sm:right-auto sm:bottom-auto sm:top-0 sm:h-screen sm:w-64 bg-gradient-to-b from-[#f0d7a7] via-[#fff3d1] to-[#ffffff] shadow-2xl p-4 z-20 border-r-4 border-[#fdb726]">
        {/* Desktop Header with Notification */}
        <div className="hidden sm:flex justify-between items-center mb-6 pb-5 border-b-2 border-[#fdb726]/30">
          <h2 className="text-xl font-bold text-[#000000]">Driver Menu</h2>
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative p-2 hover:bg-[#fdb726]/20 rounded-full transition-all duration-200 group"
            >
              <Bell className="h-5 w-5 text-[#000000] group-hover:text-[#fdb726] transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#fdb726] text-[#000000] text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg animate-pulse border-2 border-[#000000]/20">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Desktop Notification Dropdown */}
            {isNotificationOpen && (
              <div className="absolute left-0 top-full mt-2 w-96 bg-gradient-to-b from-[#ffffff] to-[#e8c58c]/20 rounded-2xl shadow-2xl border-2 border-[#fdb726]/30 overflow-hidden z-50">
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#fdb726] to-[#f5a623] border-b-2 border-[#000000]/10">
                  <h3 className="font-bold text-[#000000] text-base">
                    Notifications
                  </h3>
                  <button
                    onClick={() => setIsNotificationOpen(false)}
                    className="p-1.5 hover:bg-[#000000]/10 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-[#000000]" />
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {displayNotifications.length > 0 ? (
                    displayNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification.id)}
                        className={`px-5 py-4 border-b border-[#fdb726]/20 hover:bg-[#e8c58c]/30 cursor-pointer transition-all duration-200 ${
                          !notification.isRead
                            ? "bg-[#fdb726]/10 hover:bg-[#fdb726]/20"
                            : ""
                        }`}
                      >
                        <div className="flex items-start space-x-3">
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
                              {!notification.isRead && (
                                <span className="w-2 h-2 bg-[#fdb726] rounded-full flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-xs text-[#000000]/70 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-[#000000]/50 mt-1.5 font-medium">
                              {notification.timestamp}
                            </p>
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
                    onClick={handleSeeAllNotifications}
                    className="w-full px-5 py-3.5 text-center text-sm font-bold text-[#000000] hover:bg-[#fdb726]/20 transition-colors border-t-2 border-[#fdb726]/30"
                  >
                    See All Notifications
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <NavigationMenu orientation="vertical" className="w-full">
          <NavigationMenuList className="flex flex-row sm:flex-col justify-around sm:justify-start sm:space-y-3 w-full">
            {/* Mobile Notification Icon */}
            <NavigationMenuItem className="w-full sm:hidden">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="flex items-center justify-center p-3 w-full hover:bg-[#fdb726]/20 rounded-xl transition-colors relative"
              >
                <Bell className="h-5 w-5 text-[#000000]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-6 bg-[#fdb726] text-[#000000] text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold border border-[#000000]/20">
                    {unreadCount}
                  </span>
                )}
              </button>
            </NavigationMenuItem>

            <NavigationMenuItem className="w-full">
              <NavLink
                to="/driver/dashboard"
                className={({ isActive }) => linkStyles(isActive)}
              >
                <LayoutDashboard className="mr-0 sm:mr-3 h-5 w-5" />
                <span className="hidden sm:inline">Dashboard</span>
              </NavLink>
            </NavigationMenuItem>
            <NavigationMenuItem className="w-full">
              <NavLink
                to="/driver/profile"
                className={({ isActive }) => linkStyles(isActive)}
              >
                <User className="mr-0 sm:mr-3 h-5 w-5" />
                <span className="hidden sm:inline">Profile</span>
              </NavLink>
            </NavigationMenuItem>
            <NavigationMenuItem className="w-full">
              <NavLink
                to="/driver/wallet"
                className={({ isActive }) => linkStyles(isActive)}
              >
                <Wallet className="mr-0 sm:mr-3 h-5 w-5" />
                <span className="hidden sm:inline">Wallet</span>
              </NavLink>
            </NavigationMenuItem>
            <NavigationMenuItem className="w-full">
              <NavLink
                to="/driver/trips"
                className={({ isActive }) => linkStyles(isActive)}
              >
                <MapPin className="mr-0 sm:mr-3 h-5 w-5" />
                <span className="hidden sm:inline">Trips</span>
              </NavLink>
            </NavigationMenuItem>
            <NavigationMenuItem className="w-full">
              <NavLink
                to="/driver/documents"
                className={({ isActive }) => linkStyles(isActive)}
              >
                <FileText className="mr-0 sm:mr-3 h-5 w-5" />
                <span className="hidden sm:inline">Documents</span>
              </NavLink>
            </NavigationMenuItem>
            <NavigationMenuItem className="w-full hidden sm:block">
              <button
                onClick={logoutHandle}
                className="flex items-center p-4 w-full hover:bg-[#fdb726]/20 hover:text-[#000000] rounded-xl transition-all duration-300 text-left text-[#000000]/80 font-medium hover:shadow-md"
              >
                <LogOut className="mr-3 h-5 w-5" />
                <span>Logout</span>
              </button>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Mobile Status Buttons */}
        {(rideData.isOpen || isPaymentPending) && (
          <div className="sm:hidden mt-4 pt-4 border-t-2 border-[#fdb726]/30 space-y-2">
            {isPaymentPending ? (
              <button
                onClick={handlePaymentNavigation}
                className="flex items-center justify-center space-x-2 px-4 py-3 rounded-full bg-gradient-to-r from-[#fdb726] to-[#f5a623] hover:from-[#f5a623] hover:to-[#fdb726] font-bold text-sm w-full transition-all duration-300 shadow-xl border-2 border-[#000000]/10"
              >
                <AlertCircle size={18} className="text-[#000000]" />
                <span className="text-[#000000]">
                  {rideData.paymentStatus === "failed"
                    ? "Payment Failed"
                    : "Payment Pending"}
                </span>
              </button>
            ) : (
              <button
                onClick={handleRideMapNavigation}
                className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-full font-bold text-sm w-full transition-all duration-300 border-2 ${
                  isPulsing
                    ? "bg-[#fdb726] shadow-2xl shadow-[#fdb726]/50 scale-105 border-[#000000]/20"
                    : "bg-[#f5a623] shadow-lg scale-100 border-[#000000]/10"
                }`}
              >
                <Navigation size={18} className="text-[#000000]" />
                <span className="text-[#000000]">Ride Map</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isPulsing ? "bg-[#000000]" : "bg-[#000000]/50"
                  } transition-colors duration-300`}
                />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mobile Notification Modal */}
      {isNotificationOpen && (
        <div
          className="sm:hidden fixed inset-0 bg-[#000000]/70 z-40 backdrop-blur-sm"
          onClick={() => setIsNotificationOpen(false)}
        >
          <div
            className="fixed bottom-16 left-0 right-0 bg-gradient-to-b from-[#ffffff] to-[#e8c58c]/30 rounded-t-3xl shadow-2xl max-h-[80vh] overflow-hidden border-t-4 border-[#fdb726]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#fdb726] to-[#f5a623] border-b-2 border-[#000000]/10">
              <h3 className="font-bold text-[#000000] text-base">
                Notifications
              </h3>
              <button
                onClick={() => setIsNotificationOpen(false)}
                className="p-1.5 hover:bg-[#000000]/10 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-[#000000]" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {displayNotifications.length > 0 ? (
                displayNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id)}
                    className={`px-5 py-4 border-b border-[#fdb726]/20 active:bg-[#e8c58c]/50 transition-colors ${
                      !notification.isRead ? "bg-[#fdb726]/10" : ""
                    }`}
                  >
                    <div className="flex items-start space-x-3">
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
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-[#fdb726] rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-[#000000]/70 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-[#000000]/50 mt-1.5 font-medium">
                          {notification.timestamp}
                        </p>
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
                onClick={handleSeeAllNotifications}
                className="w-full px-5 py-3.5 text-center text-sm font-bold text-[#000000] active:bg-[#fdb726]/20 transition-colors border-t-2 border-[#fdb726]/30"
              >
                See All Notifications
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DriverNavbar;
