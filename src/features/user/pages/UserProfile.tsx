import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Copy,
  Edit2,
  Check,
  X,
  Mail,
  Phone,
  Gift,
  Eye,
  ArrowRight,
  Wallet,
  Car,
  XCircle,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import {
  fetchData,
  postData,
  updateData,
} from "@/shared/services/api/api-service";
import { ResponseCom } from "@/shared/types/common";
import { handleCustomError } from "@/shared/utils/error";
import UserApiEndpoints from "@/constants/user-api-end-pointes";
import { formatDate } from "@/shared/utils/format";
import GlobalLoading from "@/shared/components/loaders/GlobalLoading";
import { toast } from "@/shared/hooks/use-toast";

interface RideDetails {
  completedRides: number;
  cancelledRides: number;
}

interface WalletInfo {
  balance: number;
  transactions: number;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  mobile: string;
  userImage: string;
  referralCode: string;
  joiningDate: string;
  accountStatus: string;
  wallet: WalletInfo;
  rideDetails: RideDetails;
}

const UserProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);

        const res = await fetchData<ResponseCom["data"]>(
          UserApiEndpoints.PROFILE
        );
        if (res?.data && res?.status == 200) {
          setUser(res?.data);
          setTempName(res?.data.name);
        }
      } catch (err) {
        handleCustomError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveImage = async () => {
    try {
      if (imagePreview && user && selectedImage) {
        const formData = new FormData();
        formData.append("avatar", selectedImage);
        setLoading(true);

        const res = await updateData(UserApiEndpoints.UPDATE_AVATAR, formData);
        if (res?.status === 201) {
          setUser({ ...user, userImage: imagePreview });
          setSelectedImage(null);
          setImagePreview(null);
          toast({
            description: "Avatar updated successfully",
            variant: "success",
          });
        }
      } else {
        toast({
          description: "add a image before submitting",
          variant: "error",
        });
      }
    } catch (error) {
      handleCustomError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (user) {
      try {
        setLoading(true);
        const res = await updateData(UserApiEndpoints.NAME, {
          tempName,
        });
        if (res?.status === 200) {
          setUser({...user,name:tempName})
          toast({
            description: "name updated successfully",
            variant: "success",
          });
          setIsEditingName(false);
        }
      } catch (error) {
        handleCustomError(error);
      } finally {
        setIsEditingName(false);
        setLoading(false);
      }
    }
  };

  const handleCancelImageEdit = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCancelNameEdit = () => {
    if (user) setTempName(user.name);
    setIsEditingName(false);
  };

  const copyReferralCode = async () => {
    if (!user) return;
    try {
      await navigator.clipboard.writeText(user.referralCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      console.error("Failed to copy referral code");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-800 text-white pb-20 sm:pb-4 sm:pl-64">
        <GlobalLoading isLoading={loading} title="loading profile..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        no data found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-800 text-white">
      <Navbar />

      <div className="pt-20 pb-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* === PROFILE CARD === */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-black to-gray-800 rounded-2xl shadow-sm border border-gray-700 overflow-hidden">
                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="relative inline-block">
                      <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-4 border-4 border-gray-700 shadow-lg">
                        <img
                          src={imagePreview || user.userImage}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 bg-gray-900 hover:bg-gray-700 p-2.5 rounded-full"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </div>

                    {imagePreview && (
                      <div className="flex justify-center space-x-3 mb-4">
                        <button
                          onClick={handleSaveImage}
                          className="flex items-center px-4 py-2 bg-green-700 rounded-full"
                        >
                          <Check className="w-4 h-4 mr-1" /> Save
                        </button>
                        <button
                          onClick={handleCancelImageEdit}
                          className="flex items-center px-4 py-2 bg-gray-700 rounded-full"
                        >
                          <X className="w-4 h-4 mr-1" /> Cancel
                        </button>
                      </div>
                    )}

                    <div className="mb-4">
                      {isEditingName ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-700 rounded-full text-center bg-gray-900"
                          />
                          <div className="flex justify-center space-x-3">
                            <button
                              onClick={handleSaveName}
                              className="flex items-center px-4 py-2 bg-green-700 rounded-full"
                            >
                              <Check className="w-4 h-4 mr-1" /> Save
                            </button>
                            <button
                              onClick={handleCancelNameEdit}
                              className="flex items-center px-4 py-2 bg-gray-700 rounded-full"
                            >
                              <X className="w-4 h-4 mr-1" /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <h2 className="text-2xl font-bold">{user.name}</h2>
                          <button
                            onClick={() => setIsEditingName(true)}
                            className="text-gray-400 hover:text-white p-2 rounded-full"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-gray-400 text-sm">
                      Member since {formatDate(user.joiningDate)}
                    </p>
                  </div>

                  {/* Contact */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-4 bg-gray-900 rounded-xl">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-400">Email</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 p-4 bg-gray-900 rounded-xl">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-400">Phone</p>
                        <p className="font-medium">+91 {user.mobile}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Referral */}
                <div className="p-6 bg-gradient-to-br from-black to-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Gift className="w-5 h-5" />
                      <div>
                        <p className="text-sm text-gray-400">Referral Code</p>
                        <p className="font-mono font-bold text-lg">
                          {user.referralCode}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={copyReferralCode}
                      className="flex items-center px-4 py-2 bg-gray-900 rounded-full"
                    >
                      {copySuccess ? (
                        <Check className="w-4 h-4 mr-2" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      {copySuccess ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* === MAIN CARDS === */}
            <div className="lg:col-span-2 space-y-6">
              {/* Rides */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-black to-gray-800 rounded-2xl border border-gray-700">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold">Ride Summary</h3>
                      <Car className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-4 bg-gray-900 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-sm text-green-400">Completed</p>
                          <p className="text-2xl font-bold text-green-400">
                            {user.rideDetails.completedRides}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-4 bg-gray-900 rounded-xl">
                        <XCircle className="w-5 h-5 text-red-400" />
                        <div>
                          <p className="text-sm text-red-400">Cancelled</p>
                          <p className="text-2xl font-bold text-red-400">
                            {user.rideDetails.cancelledRides}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-gray-700">
                    <button
                      onClick={() => navigate("/trips")}
                      className="w-full flex items-center justify-center space-x-2 py-3 bg-gray-900 rounded-xl"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View All Rides</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Wallet */}
                <div className="bg-gradient-to-br from-black to-gray-800 rounded-2xl border border-gray-700">
                  <div className="p-6 text-center">
                    <h3 className="text-lg font-semibold mb-2">Wallet</h3>
                    <Wallet className="w-6 h-6 text-green-400 mx-auto mb-4" />
                    <p className="text-4xl font-bold text-green-400 mb-2">
                      {`${user.wallet.balance || 0}`}
                    </p>
                    <p className="text-sm text-gray-400">
                      {user.wallet.transactions} recent transactions
                    </p>
                  </div>
                  <div className="px-6 py-4 border-t border-gray-700">
                    <button className="w-full flex items-center justify-center space-x-2 py-3 bg-gray-900 rounded-xl">
                      <Eye className="w-4 h-4" />
                      <span>View Wallet</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-gradient-to-br from-black to-gray-800 rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center space-x-4">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <div>
                    <h3 className="text-lg font-semibold">Account Status</h3>
                    <p className="text-green-400">{user.accountStatus}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
