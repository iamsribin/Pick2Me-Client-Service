import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  CheckCircle,
  Clock,
  CreditCard,
  Banknote,
  Wallet,
  User,
  MapPin,
  Car,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RootState } from "@/shared/services/redux/store";
import { useNavigate } from "react-router-dom";

interface PaymentState {
  method: "Cash" | "Wallet" | "Strip";
  status: "Pending" | "Failed" | "Completed" | "idle";
  amount: number;
  transactionId?: string;
}

const DriverPaymentPage: React.FC = () => {
  const navigate = useNavigate();

  const currentRideData = useSelector(
    (state: RootState) => state.RideData.rideDetails
  );


  const [paymentState, setPaymentState] = useState<PaymentState>({
    method: currentRideData.paymentMode,
    status: currentRideData.paymentStatus,
    amount: currentRideData.price,
  });

  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const handleCashReceived = () => {};

  useEffect(() => {
    if (!currentRideData) {
      navigate("/driver/dashboard");
    }
  }, [currentRideData, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [paymentState.status]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!currentRideData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">Loading ride data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Success Animation Overlay */}
      <AnimatePresence>
        {showSuccessAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-green-600 bg-opacity-90 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center text-white"
            >
              <CheckCircle className="w-24 h-24 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">Payment Completed!</h2>
              <p className="text-xl">Ride finished successfully</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Payment Processing
          </h1>
          <p className="text-gray-600">Waiting for customer payment</p>
        </motion.div>

        {/* Customer Info Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
              {currentRideData.user.userProfile ? (
                <img
                  src={currentRideData.user.userProfile}
                  alt="Customer"
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-gray-500" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">
                {currentRideData.user.userName}
              </h3>
              <p className="text-sm text-gray-600">
                {currentRideData.user.userNumber}
              </p>
            </div>
          </div>

          {/* Trip Details */}
          <div className="space-y-3 text-sm">
            <div className="flex items-start">
              <MapPin className="w-4 h-4 text-green-600 mr-2 mt-1" />
              <div>
                <p className="text-gray-500">Pickup</p>
                <p className="text-gray-800">
                  {currentRideData.pickupCoordinates.address}
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <MapPin className="w-4 h-4 text-red-600 mr-2 mt-1" />
              <div>
                <p className="text-gray-500">Dropoff</p>
                <p className="text-gray-800">
                  {currentRideData.dropOffCoordinates.address}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Payment Status Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Banknote className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              ₹{paymentState.amount}
            </h3>
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-blue-600 bg-blue-50`}
            >
              {/* {paymentState.status === 'pending' && <Clock className="w-4 h-4 mr-1" />} */}
              {/* {paymentState.status === 'processing' && ( */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 mr-1 border-2 border-current border-t-transparent rounded-full"
              />
              {/* // )} */}
              {/* {paymentState.status === "Completed" && (
                <CheckCircle className="w-4 h-4 mr-1" />
              )} */}
              {/* {paymentState.status.charAt(0).toUpperCase() +
                paymentState.status.slice(1)} */}
            </div>
          </div>

          {/* Payment Method Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            {/* <div className="flex items-center justify-between">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium capitalize text-gray-800">
                {paymentState.method === 'online' ? 'Online Payment' : paymentState.method}
              </span>
            </div> */}
            <div className="flex items-center justify-between mt-2">
              <span className="text-gray-600">Time Elapsed</span>
              <span className="font-mono text-gray-800">
                {formatTime(timeElapsed)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          {paymentState.method === "Cash" &&
          paymentState.status === "Pending" ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCashReceived}
              className="w-full bg-green-600 text-white font-semibold py-4 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <Banknote className="w-5 h-5 mr-2" />
              Confirm Cash Received
            </motion.button>
          ) : (
            <div className="text-center">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex items-center text-blue-600 font-medium"
              >
                <Clock className="w-5 h-5 mr-2" />
                Waiting for customer to complete payment...
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-4"
        >
          <h4 className="font-semibold text-gray-800 mb-3">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center py-3 px-4 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              <Car className="w-4 h-4 mr-2" />
              Call Customer
            </button>
            <button className="flex items-center justify-center py-3 px-4 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              <Clock className="w-4 h-4 mr-2" />
              Report Issue
            </button>
          </div>
        </motion.div>

        {/* Demo Controls (Remove in production) */}
        {/* <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium mb-2">Demo Controls:</p>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setPaymentState(prev => ({ ...prev, method: 'cash', status: 'pending' }))}
              className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded"
            >
              Cash
            </button>
            <button
              onClick={() => setPaymentState(prev => ({ ...prev, method: 'wallet', status: 'processing' }))}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded"
            >
              Wallet
            </button>
            <button
              onClick={() => setPaymentState(prev => ({ ...prev, method: 'online', status: 'processing' }))}
              className="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded"
            >
              Online
            </button>
          </div>
          <p className="text-xs text-yellow-700">
            {rideData ? 'Using real Redux data' : 'Using dummy data (Redux not connected)'}
          </p>
        </div> */}
      </div>
    </div>
  );
};

export default DriverPaymentPage;
