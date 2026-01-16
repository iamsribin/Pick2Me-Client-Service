import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
  TrendingUp,
} from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/shared/components/ui/navigation-menu";
import { RootState } from "@/shared/services/redux/store";
import { useSelector } from "react-redux";
import { handleLogout } from "@/shared/utils/auth";
import NotificationPanel from "../../../shared/components/NotificationPanel";
import { useIsMobile } from "@/shared/hooks/useMobile";

const DriverNavbar = () => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isPulsing, setIsPulsing] = useState(true);
  const isMobileView = useIsMobile();
  const navigate = useNavigate();
  const notifications = useSelector(
    (state: RootState) => state.notification.items
  );
  const rideData = useSelector(
    (state: RootState) => state.RideData.rideDetails
  );
  const unreadCount = notifications.filter((n) => !n.read).length;

  const isPaymentPending =
    rideData.paymentStatus === "Pending" || rideData.paymentStatus === "Failed";

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

  const logoutHandle = () => {
    handleLogout();
  };

  const handleRideMapNavigation = () => {
    navigate(`/driver/ride-tracking/${rideData.rideId}`);
  };

  const handlePaymentNavigation = () => {
    console.log("Navigate to payment");
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
      {(rideData.status || isPaymentPending) && (
        <div className="hidden sm:block fixed top-4 right-6 z-30">
          {isPaymentPending ? (
            <button
              onClick={handlePaymentNavigation}
              className="flex items-center space-x-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#fdb726] to-[#f5a623] hover:from-[#f5a623] hover:to-[#fdb726] font-bold text-sm transition-all duration-300 shadow-xl hover:scale-110 border-2 border-black/10"
            >
              <AlertCircle size={18} className="text-black" />
              <span className="text-black">
                {rideData?.paymentStatus === "Failed"
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
          <div className="relative">
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

            {/* Desktop Notification Panel */}
            <NotificationPanel
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(false)}
              isMobile={false}
            />
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
                to="/driver/activity"
                className={({ isActive }) => linkStyles(isActive)}
              >
                <TrendingUp className="mr-0 sm:mr-3 h-5 w-5" />
                <span className="hidden sm:inline">Activity</span>
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
        {(rideData.status || isPaymentPending) && (
          <div className="sm:hidden mt-4 pt-4 border-t-2 border-[#fdb726]/30 space-y-2">
            {isPaymentPending ? (
              <button
                onClick={handlePaymentNavigation}
                className="flex items-center justify-center space-x-2 px-4 py-3 rounded-full bg-gradient-to-r from-[#fdb726] to-[#f5a623] hover:from-[#f5a623] hover:to-[#fdb726] font-bold text-sm w-full transition-all duration-300 shadow-xl border-2 border-[#000000]/10"
              >
                <AlertCircle size={18} className="text-[#000000]" />
                <span className="text-[#000000]">
                  {rideData.paymentStatus === "Failed"
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

      {/* Mobile Notification Panel */}
      {isMobileView && (
        <NotificationPanel
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          isMobile={true}
        />
      )}
    </>
  );
};

export default DriverNavbar;
