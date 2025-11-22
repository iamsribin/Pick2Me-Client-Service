import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useFormik } from "formik";
import { Eye } from "lucide-react";
import { Button } from "@chakra-ui/react";
import { userBlockUnblockValidation } from "@/shared/utils/validation";
import { ResponseCom } from "@/shared/types/common";
import {
  fetchData,
  updateData,
} from "@/shared/services/api/api-service";
import { AdminApiEndpoints } from "@/constants/admin-api-end-pointes";
import { toast } from "@/shared/hooks/use-toast";
import { handleCustomError } from "@/shared/utils/error";

const UserDetails = () => {
  const [statusModal, setStatusModal] = useState(false);
  const [reasonModal, setReasonModal] = useState(false);
  const [userData, setUserData] = useState<ResponseCom["data"] | null>(null);
  const { id } = useParams();

  const getData = async () => {
    try {
      
      if(!id) {
        toast({description:"user id is missing in params", variant:"error"})
        return
      }
      const res = await fetchData<ResponseCom["data"]>(AdminApiEndpoints.USER.replace(":id",id));
      const data = res?.data;
      setUserData(data);
    } catch (error) { 
      handleCustomError(error);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const formikStatus = useFormik({
    initialValues: {
      reason: "",
      status: "",
    },
    validationSchema: userBlockUnblockValidation,
    onSubmit: async (values, { setSubmitting }) => {
      try {

        const res = await updateData<ResponseCom["data"]>(
          AdminApiEndpoints.USER + `?id=${id}`,
          values
        );
         const data = res?.data;
        if (data.message === "Success") {
          setStatusModal(false);
          toast({description:"Status updated successfully!", variant:"success"});
          getData();
        } 
      } catch (error) {
        handleCustomError(error)
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <>
      {statusModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 sm:mx-auto">
            <div className="px-6 pt-5 pb-4">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <div className="mt-4 text-center">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                  Update User Status
                </h3>

                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Please make sure you've verified all user information before
                  proceeding with this action.
                </p>
              </div>

              <form onSubmit={formikStatus.handleSubmit} className="mt-5">
                <div className="mt-2 -mx-1 text-center">
                  <div className="relative">
                    <select
                      name="status"
                      onChange={formikStatus.handleChange}
                      onBlur={formikStatus.handleBlur}
                      className="block w-full px-4 py-3 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-40 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-blue-300"
                    >
                      <option value="" disabled selected>
                        Select the updated status
                      </option>
                      <option value="Block">Block</option>
                      <option value="Good">Good</option>
                    </select>
                  </div>
                  <div className="text-left mt-1 text-red-500">
                    <p className="text-xs">
                      {formikStatus.touched.status &&
                        formikStatus.errors.status}
                    </p>
                  </div>

                  <div className="mt-4">
                    <label
                      htmlFor="reason"
                      className="block text-sm font-medium text-left text-gray-700 dark:text-gray-200"
                    >
                      Reason for status change
                    </label>
                    <textarea
                      id="reason"
                      name="reason"
                      rows={3}
                      onBlur={formikStatus.handleBlur}
                      onChange={formikStatus.handleChange}
                      className="block w-full px-4 py-3 mt-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-40 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-blue-300"
                      placeholder="Please provide detailed reason for this status change..."
                    />
                    <div className="text-left mt-1 text-red-500">
                      <p className="text-xs">
                        {formikStatus.touched.reason &&
                          formikStatus.errors.reason}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 sm:flex sm:items-center sm:justify-between">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setStatusModal(false);
                    }}
                    type="button"
                    className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg sm:w-auto hover:bg-gray-50 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-40"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="w-full px-4 py-2 mt-3 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-blue-600 rounded-lg sm:mt-0 sm:w-auto hover:bg-blue-500 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-40"
                  >
                    Update Status
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {reasonModal && userData?.reason && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 sm:mx-auto">
            {/* Modal Header */}
            <div className="px-6 pt-5 pb-4">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              {/* Modal Title and Content */}
              <div className="mt-4 text-center">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                  Reason for Account{" "}
                  {userData?.accountStatus === "Good" ? "Unblock:" : "Block:"}
                </h3>
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                  <p>{userData.reason}</p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={() => setReasonModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-40 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen p-6">
        <h1 className="text-3xl font-bold text-black mb-6">User Profile</h1>

        {userData && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Profile Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col items-center">
                {userData?.userImage ? (
                  <img
                    src={userData.userImage}
                    alt={userData.name}
                    width={128}
                    height={128}
                    className="w-32 h-32 rounded-full object-cover mb-4"
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/128";
                    }}
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full mb-4 bg-gray-200 flex items-center justify-center">
                    <span className="text-4xl text-gray-500 font-semibold">
                      {userData?.name?.charAt(0).toUpperCase() || ""}
                    </span>
                  </div>
                )}
                <h2 className="text-2xl font-bold">{userData?.name}</h2>
                <p className="text-gray-600">{userData?.email}</p>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between">
                  <span className="font-semibold">Mobile:</span>
                  <span>{userData?.mobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Joining Date:</span>
                  <span>
                    {userData?.joiningDate ? userData.joiningDate : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Referral Code:</span>
                  <span>{userData?.referralCode || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">
                    Resone for{" "}
                    {userData?.accountStatus === "Good" ? "Unblock:" : "Block:"}
                  </span>
                  <span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReasonModal(true)}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      View
                    </Button>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Account Status:</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${
                      userData?.accountStatus === "Good"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  >
                    {userData?.accountStatus}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setStatusModal(true)}
                className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
              >
                Update Account Status
              </button>
            </div>

            {/* Right Column - Additional Details */}
            <div className="space-y-6">
              {/* Wallet Information */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Wallet Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Balance:</span>
                    <span>
                      ${userData.wallet?.balance?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Total Transactions:</span>
                    <span>{userData.wallet?.transactions?.length || 0}</span>
                  </div>
                </div>
              </div>

              {/* Ride Statistics */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Ride Statistics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Completed Rides:</span>
                    <span>{userData.RideDetails?.completedRides || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Cancelled Rides:</span>
                    <span>{userData.RideDetails?.cancelledRides || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Location</h3>
                <p className="text-gray-600">
                  Location data not available
                  {/* {userData.location || "Not specified"} */}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserDetails;
