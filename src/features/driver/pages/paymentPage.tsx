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
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RootState } from "@/shared/services/redux/store";
import { useNavigate } from "react-router-dom";
import socketService from "@/shared/services/socketService";
import { postData } from "@/shared/services/api/api-service";
import { emitSocket } from "@/shared/utils/emitSocket";
import DriverApiEndpoints from "@/constants/driver-api-end-pontes";
import { handleCustomError } from "@/shared/utils/error";
import { toast } from "@/shared/hooks/use-toast";
import { clearRide } from "@/shared/services/redux/slices/rideSlice";

interface PaymentState {
  method: "Cash" | "Wallet" | "Strip";
  status: "Pending" | "Failed" | "Completed" | "idle";
  amount: number;
  transactionId?: string;
}

const DriverPaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [socketData, setSocketData] = useState(null);

  useEffect(() => {
    socketService.on("user:cash-payment:conformation", (data) => {
      console.log("user:cash-payment:conformation", data);
      setSocketData(data);
      setShowConfirmModal(true);
    });

    return () => {
      // socketService.off("user:cash-payment:conformation");
    };
  }, []);

  const handleConfirmYes = async () => {
    setShowConfirmModal(false);
    setIsUpdatingPayment(true);
    
    try {
      
      const response = await postData(DriverApiEndpoints.CASH_IN_HAND_PAYMENT, socketData);
      console.log("Payment confirmed:", response);
      dispatch(clearRide());
      toast({description: "Payment completed successfully", variant: "success"})
      setIsUpdatingPayment(false);
    } catch (error) {
      console.error("Payment confirmation failed:", error);
      setIsUpdatingPayment(false);
      handleCustomError(error);
    }
  };

  const handleConfirmNo = () => {
    setShowConfirmModal(false);
    console.log("socketData",socketData);
    // socketData.userId = "370d31f7-a9a4-4ec6-84c1-84a6e8475093"
    dispatch(emitSocket("driver:cash-payment:not-received", socketData));
  };

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
      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-green-600" />
                </div>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Payment Confirmation
              </h3>
              <p className="text-gray-600 mb-6">
                Did you receive the amount in hand from the user?
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmNo}
                  className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  No
                </button>
                <button
                  onClick={handleConfirmYes}
                  className="flex-1 py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  Yes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 mr-1 border-2 border-current border-t-transparent rounded-full"
              />
            </div>
          </div>

          {/* Payment Method Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
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
                {isUpdatingPayment ? "Updating payment..." : "Waiting for customer to complete payment..."}
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
      </div>
    </div>
  );
};

export default DriverPaymentPage;