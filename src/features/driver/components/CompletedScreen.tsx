import { useNavigate } from "react-router-dom";

export const CompletedScreen = ({ rideDetails }:any) => {
const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 p-6">
      <div className="bg-white backdrop-blur-lg rounded-3xl p-8 max-w-md w-full border-2 border-yellow-500 shadow-2xl">
        <div className="flex flex-col items-center space-y-6">
          <div className="bg-green-100 rounded-full p-6 border-2 border-green-500">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">✓</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 text-center">
            Ride Completed Successfully!
          </h2>
          <p className="text-gray-700 text-center">
            Great job! Your earnings have been added to your wallet.
          </p>
          <div className="w-full bg-yellow-50 rounded-lg p-4 space-y-3 border border-yellow-300">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Distance</span>
              <span className="text-gray-900 font-semibold">
                {rideDetails.distanceInfo?.distance}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Duration</span>
              <span className="text-gray-900 font-semibold">
                {rideDetails.duration}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Earnings</span>
              <span className="text-yellow-600 font-bold text-lg">
                ₹{rideDetails.price}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate("/driver/dashboard")}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold py-3 rounded-full transition-all duration-300 shadow-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
