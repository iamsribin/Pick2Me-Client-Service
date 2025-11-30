import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Menu, X, User, ChevronDown, Navigation, AlertCircle } from 'lucide-react';
import { useDispatch, useSelector } from "react-redux";
import { RootState, store } from "@/shared/services/redux/store";
import { handleLogout } from "@/shared/utils/auth";

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPulsing, setIsPulsing] = useState(true);

  const navigate = useNavigate();
  
  const user = store.getState().user.role === "User"
  const rideData = useSelector((state: RootState) => state.RideData.status);
  // const paymentStatus = useSelector((state: RootState) => state.RideMap.paymentStatus);
    
const paymentStatus = null;
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Blinking effect for active ride button
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (rideData) {
      interval = setInterval(() => {
        setIsPulsing(prev => !prev);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [rideData]);

  const handleRideMapNavigation = () => {
    navigate("/ride-tracking");
  };

  const handlePaymentNavigation = () => {
    navigate("/payment");
  };

  const isPaymentPending = paymentStatus === "pending" || paymentStatus === "failed";

// Updated Navbar Header Component for Pick2Me
// Replace the header return statement in your navbar component with this

return (
  <header
    className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? "bg-black/90 backdrop-blur-md shadow-lg shadow-yellow-500/10" : "bg-transparent"
    }`}
  >
    <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        {/* Logo Section */}
        <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group">
          <div className="relative">
            {/* Rounded logo container with glow effect */}
            <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-yellow-500/50 group-hover:border-yellow-400 transition-all duration-300 shadow-lg shadow-yellow-500/30">
              <img 
                src="images/logo.png" 
                alt="Pick2Me" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <span className="font-bold text-lg sm:text-xl text-white group-hover:text-yellow-400 transition-colors duration-300">
            Pick<span className="text-yellow-500">2</span>Me
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
          <Link
            to="/"
            className="text-gray-300 hover:text-yellow-400 transition-colors font-medium"
          >
            Home
          </Link>
          <Link
            to="/about"
            className="text-gray-300 hover:text-yellow-400 transition-colors font-medium"
          >
            About
          </Link>
          <Link
            to="/services"
            className="text-gray-300 hover:text-yellow-400 transition-colors font-medium"
          >
            Services
          </Link>
          <Link
            to="/contact"
            className="text-gray-300 hover:text-yellow-400 transition-colors font-medium"
          >
            Contact
          </Link>
        </nav>

        {user ? (
          <>
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Active Ride Button */}
              {rideData && !isPaymentPending && (
                <button
                  onClick={handleRideMapNavigation}
                  className={`hidden sm:flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                    isPulsing 
                      ? 'bg-green-500 shadow-lg shadow-green-500/50' 
                      : 'bg-green-600 shadow-md'
                  } hover:bg-green-500`}
                >
                  <Navigation size={18} className="text-white" />
                  <span className="text-white text-sm">Track your ride</span>
                  <span className={`w-2 h-2 rounded-full ${
                    isPulsing ? 'bg-white' : 'bg-green-300'
                  } transition-colors duration-300`} />
                </button>
              )}

              {/* Payment Pending Button */}
              {isPaymentPending && (
                <button
                  onClick={handlePaymentNavigation}
                  className="hidden sm:flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-600 font-medium transition-all duration-300 shadow-lg shadow-amber-500/30 animate-pulse"
                >
                  <AlertCircle size={18} className="text-white" />
                  <span className="text-white text-sm">
                    {paymentStatus === "failed" ? "Payment Failed" : "Payment Pending"}
                  </span>
                </button>
              )}

              {/* User Profile Dropdown */}
              <div className="relative group">
                <button className="flex items-center space-x-1 text-gray-300 hover:text-yellow-400 transition-colors duration-200 px-2 sm:px-3 py-2 rounded-lg hover:bg-yellow-500/10">
                  <User size={18} />
                  <ChevronDown size={16} className="hidden sm:block" />
                </button>
                <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 top-full right-0 mt-2 w-48 bg-black/95 backdrop-blur-md rounded-lg p-3 z-10 border border-yellow-500/30 shadow-xl shadow-yellow-500/20">
                  <div className="py-1">
                    <Link 
                      to="/profile" 
                      className="block px-4 py-2 text-sm hover:bg-yellow-500/20 rounded-md transition-colors duration-200 text-white"
                    >
                      Profile
                    </Link>
                    <Link 
                      to="/driver/login" 
                      className="block px-4 py-2 text-sm hover:bg-yellow-500/20 rounded-md transition-colors duration-200 text-white"
                    >
                      Login as Driver
                    </Link>
                    <Link 
                      to="/login" 
                      className="block px-4 py-2 text-sm hover:bg-yellow-500/20 rounded-md transition-colors duration-200 text-white"
                      onClick={() => {
                        handleLogout();
                      }}
                    >
                      Logout
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
              <Link to="/login">
                <Button 
                  variant="outline" 
                  className="rounded-full px-4 lg:px-6 border-yellow-500/50 text-black-400 hover:text-white-400 hover:text-white-500/10 hover:border-yellow-400"
                >
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="rounded-full px-4 lg:px-6 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold shadow-lg shadow-yellow-500/30">
                  Sign Up
                </Button>
              </Link>
            </div>
          </>
        )}

        {/* Mobile Menu Button */}
        <button
          className="md:hidden focus:outline-none p-2 hover:bg-yellow-500/10 rounded-lg transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6 text-yellow-400" />
          ) : (
            <Menu className="h-6 w-6 text-yellow-400" />
          )}
        </button>
      </div>
    </div>

    {/* Mobile Navigation */}
    {isMenuOpen && (
      <div className="md:hidden bg-black/95 backdrop-blur-md shadow-lg border-t border-yellow-500/30">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <nav className="flex flex-col space-y-3">
            {/* Mobile Ride Status Buttons */}
            {user && (
              <div className="flex flex-col space-y-2 pb-4 border-b border-yellow-500/30">
                {rideData && !isPaymentPending && (
                  <button
                    onClick={() => {
                      handleRideMapNavigation();
                      setIsMenuOpen(false);
                    }}
                    className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-full font-medium transition-all duration-300 ${
                      isPulsing 
                        ? 'bg-green-500 shadow-lg shadow-green-500/50' 
                        : 'bg-green-600 shadow-md'
                    }`}
                  >
                    <Navigation size={18} className="text-white" />
                    <span className="text-white">Go to Ride Map</span>
                    <span className={`w-2 h-2 rounded-full ${
                      isPulsing ? 'bg-white' : 'bg-green-300'
                    } transition-colors duration-300`} />
                  </button>
                )}

                {isPaymentPending && (
                  <button
                    onClick={() => {
                      handlePaymentNavigation();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center justify-center space-x-2 px-4 py-3 rounded-full bg-amber-500 hover:bg-amber-600 font-medium transition-all duration-300 shadow-lg shadow-amber-500/30 animate-pulse"
                  >
                    <AlertCircle size={18} className="text-white" />
                    <span className="text-white">
                      {paymentStatus === "failed" ? "Payment Failed" : "Payment Pending"}
                    </span>
                  </button>
                )}
              </div>
            )}

            <Link
              to="/"
              className="py-2 text-gray-300 hover:text-yellow-400 transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/about"
              className="py-2 text-gray-300 hover:text-yellow-400 transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              to="/services"
              className="py-2 text-gray-300 hover:text-yellow-400 transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Services
            </Link>
            <Link
              to="/contact"
              className="py-2 text-gray-300 hover:text-yellow-400 transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
            
            {user ? (
              <div className="flex flex-col space-y-2 pt-2 border-t border-yellow-500/30">
                <Link 
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button 
                    variant="outline" 
                    className="w-full rounded-full border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                  >
                    Profile
                  </Button>
                </Link>
                <Link 
                  to="/driver/login"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button 
                    variant="outline" 
                    className="w-full rounded-full border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                  >
                    Login as Driver
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full rounded-full border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex flex-col space-y-2 pt-2">
                <Link to="/login">
                  <Button 
                    variant="outline" 
                    className="w-full rounded-full border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="w-full rounded-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    )}
  </header>
);
};

export default Navbar;