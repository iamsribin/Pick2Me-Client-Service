import React, { useState, useEffect, ChangeEvent } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Star,
  Calendar,
  Car,
  XCircle,
  Wallet,
  Edit3,
  Eye,
  CreditCard,
  Camera,
  AlertTriangle,
  Save,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import DriverNavbar from "@/features/driver/components/DriverNavbar";
import { Alert, AlertDescription } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { DriverProfileData } from "./type";
import { deleteData, fetchData, updateData } from "@/shared/services/api/api-service";
import DriverApiEndpoints from "@/constants/driver-api-end-pontes";
import { ResponseCom } from "@/shared/types/common";
import { StatusCode } from "@/shared/types/enum";
import { store } from "@/shared/services/redux/store";
import { handleCustomError } from "@/shared/utils/error";
import { toast } from "@/shared/hooks/use-toast";
import { userLogout } from "@/shared/services/redux/slices/userSlice";
import axios from "axios";
import GlobalLoading from "@/shared/components/loaders/GlobalLoading";

interface EditValues {
  name: string;
  profilePhoto: File | null;
}

const DriverProfile: React.FC = () => {
  const [driverData, setDriverData] = useState<DriverProfileData | null>(null);
  const [isEditing, setIsEditing] = useState({
    name: false,
    profilePhoto: false,
  });
  const [editValues, setEditValues] = useState<EditValues>({
    name: "",
    profilePhoto: null,
  });
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    profilePhoto?: string;
  }>({});
  const [showWarning, setShowWarning] = useState(false);
  const [editingField, setEditingField] = useState<
    "name" | "profilePhoto" | ""
  >("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const driverId = store.getState().user.id;

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {

     const controller = new AbortController();

    const fetchDriverProfile = async () => {
      try {
        setLoading(true);
        const res = await fetchData<ResponseCom["data"]>(DriverApiEndpoints.PROFILE,controller.signal)
         
        if(res?.status == StatusCode.OK){
          const data = res.data as DriverProfileData;
          setDriverData(data);
          setEditValues({ name: data.name, profilePhoto: null });
        }
      } catch (error) {
        if (axios.isCancel(error)) return;
        handleCustomError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDriverProfile();

    return () => controller.abort();
  }, []);

  const handleEditStart = (field: "name" | "profilePhoto"| "") => {
    setEditingField(field);
    setShowWarning(true);
  };

  const handleEditConfirm = async (field: "name" | "profilePhoto" | "") => {
    setIsEditing((prev) => ({ ...prev, [field]: true }));
    setShowWarning(false);
    setValidationErrors({});
  };

  const handleEditCancel = (field: "name" | "profilePhoto") => {
    setIsEditing((prev) => ({ ...prev, [field]: false }));
    setEditValues((prev) => ({
      ...prev,
      [field]: field === "name" ? driverData?.name || "" : null,
    }));
    setValidationErrors({});
    setEditingField("");
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditValues((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setEditValues((prev) => ({ ...prev, profilePhoto: file }));
      setValidationErrors((prev) => ({ ...prev, profilePhoto: "" }));
    }
  };

  const handleSave = async (field: "name" | "profilePhoto") => { 
   
    if (!driverId) {
      toast({description:"Driver ID not found. Please log in again.", variant:"destructive"});
      return;
    }

     try {
         setLoading(true);
         const formData = new FormData();
         formData.append("field", field);
         if (field === "name") {
           formData.append("name", editValues.name);
         } else if (field === "profilePhoto" && editValues.profilePhoto) {
           formData.append("profilePhoto", editValues.profilePhoto);
         }
         const res  = await updateData<ResponseCom["data"]>(
           DriverApiEndpoints.PROFILE_IMAGE,
           formData,
         );
     
         if (res?.status == StatusCode.OK) {          
           toast({ description: "Profile update request sended successfully", variant: "success" });
            await store.dispatch(userLogout());
            await deleteData(`/driver/logout`);
           navigate("/driver/login", {
           state: { showPendingModal: true },
          });
         } 
       } catch (error: any) {        
         handleCustomError(error);
       } finally {
         setLoading(false);
       }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : i < rating
            ? "fill-yellow-200 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#e8c58c] via-[#f5e5c8] to-[#ffffff] pb-20 sm:pb-4 sm:pl-64">
        <DriverNavbar />
        <GlobalLoading
        isLoading={loading}
        title="loading profile..."  
      />
      </div>
    );
  }

    if ( !driverData) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-[#e8c58c] via-[#f5e5c8] to-[#ffffff] pb-20 sm:pb-4 sm:pl-64">
          <DriverNavbar />
          <div className="p-4 max-w-6xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-red-600 font-bold">
                { "No data available"}
              </div>
            </div>
          </div>
        </div>
      );
    }


  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e8c58c] via-[#f5e5c8] to-[#ffffff]">
      <DriverNavbar/>
      <div className="h-16 sm:h-0"></div>
      
      <div className="sm:ml-64 mb-16 sm:mb-0 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Main Profile Card */}
          <Card className="bg-gradient-to-br from-[#ffffff] to-[#f5e5c8]/30 border-2 border-[#fdb726]/30 shadow-2xl overflow-hidden rounded-3xl">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Profile Image */}
                <div className="relative">
                  <div className="relative">
                    <Avatar className="h-32 w-32 sm:h-40 sm:w-40 ring-4 ring-[#fdb726]/30 shadow-xl">
                      <AvatarImage
                        src={
                          editValues.profilePhoto
                            ? URL.createObjectURL(editValues.profilePhoto)
                            : driverData.driverImage
                        }
                        alt={driverData.name}
                      />
                      <AvatarFallback className="text-3xl bg-gradient-to-br from-[#fdb726] to-[#f5a623] text-[#000000] font-bold">
                        {driverData.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    {!isEditing.profilePhoto ? (
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full p-0 bg-gradient-to-r from-[#fdb726] to-[#f5a623] hover:from-[#f5a623] hover:to-[#fdb726] border-2 border-[#ffffff] shadow-lg"
                        onClick={() => handleEditStart("profilePhoto")}
                      >
                        <Camera className="h-5 w-5 text-[#000000]" />
                      </Button>
                    ) : (
                      <div className="absolute -bottom-2 -right-2 flex gap-1">
                        <Button
                          size="sm"
                          className="h-9 w-9 rounded-full p-0 bg-[#fdb726] hover:bg-[#f5a623] border-2 border-[#ffffff]"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Camera className="h-4 w-4 text-[#000000]" />
                        </Button>
                        <Button
                          size="sm"
                          className="h-9 w-9 rounded-full p-0 bg-[#fdb726] hover:bg-[#f5a623] border-2 border-[#ffffff]"
                          onClick={() => handleSave("profilePhoto")}
                          disabled={loading || !editValues.profilePhoto}
                        >
                          <Save className="h-4 w-4 text-[#000000]" />
                        </Button>
                        <Button
                          size="sm"
                          className="h-9 w-9 rounded-full p-0 bg-[#000000]/80 hover:bg-[#000000] border-2 border-[#ffffff]"
                          onClick={() => handleEditCancel("profilePhoto")}
                          disabled={loading}
                        >
                          <X className="h-4 w-4 text-[#ffffff]" />
                        </Button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ display: "none" }}
                        />
                      </div>
                    )}
                  </div>
                  {validationErrors.profilePhoto && isEditing.profilePhoto && (
                    <span className="text-red-600 text-xs absolute -bottom-10 left-0 font-medium">
                      {validationErrors.profilePhoto}
                    </span>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1 space-y-4 w-full">
                  {/* Name */}
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#fdb726] to-[#f5a623] flex items-center justify-center shadow-md">
                      <User className="h-5 w-5 text-[#000000]" />
                    </div>
                    {!isEditing.name ? (
                      <div className="flex items-center gap-2">
                        <span className="text-2xl sm:text-3xl font-bold text-[#000000]">
                          {driverData.name}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="hover:bg-[#fdb726]/20"
                          onClick={() => handleEditStart("name")}
                        >
                          <Edit3 className="h-4 w-4 text-[#fdb726]" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 flex-1">
                        <div className="flex items-center gap-2">
                          <Input
                            name="name"
                            value={editValues.name}
                            onChange={handleInputChange}
                            className="text-xl font-bold border-2 border-[#fdb726] focus:ring-[#fdb726] rounded-xl"
                          />
                          <Button
                            size="sm"
                            className="bg-[#fdb726] hover:bg-[#f5a623] text-[#000000] font-bold"
                            onClick={() => handleSave("name")}
                            disabled={loading}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-2 border-[#000000]/20"
                            onClick={() => handleEditCancel("name")}
                            disabled={loading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {validationErrors.name && (
                          <span className="text-red-600 text-xs font-medium">
                            {validationErrors.name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#fdb726] to-[#f5a623] flex items-center justify-center shadow-md">
                      <Mail className="h-5 w-5 text-[#000000]" />
                    </div>
                    <span className="text-[#000000]/80 font-medium">{driverData.email}</span>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#fdb726] to-[#f5a623] flex items-center justify-center shadow-md">
                      <Phone className="h-5 w-5 text-[#000000]" />
                    </div>
                    <span className="text-[#000000]/80 font-medium">+91 {driverData.mobile}</span>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#fdb726] to-[#f5a623] flex items-center justify-center shadow-md flex-shrink-0">
                      <MapPin className="h-5 w-5 text-[#000000]" />
                    </div>
                    <span className="text-[#000000]/80 font-medium">{driverData.address}</span>
                  </div>
                </div>

                {/* Active Badge */}
                <Badge className="bg-gradient-to-r from-[#fdb726] to-[#f5a623] text-[#000000] border-2 border-[#000000]/10 px-4 py-2 text-sm font-bold shadow-lg">
                  Active Driver
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Rating Card */}
            <Card className="bg-gradient-to-br from-[#ffffff] to-[#e8c58c]/20 border-2 border-[#fdb726]/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#000000]/70 uppercase tracking-wide mb-2">
                      Total Rating
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-2xl font-bold text-[#fdb726]">
                        {driverData.totalRatings}
                      </span>
                      <div className="flex">
                        {renderStars(driverData.totalRatings)}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" className="bg-[#fdb726]/20 hover:bg-[#fdb726]/30 text-[#000000] border-2 border-[#fdb726]/30 rounded-xl h-8 w-8 p-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Joined Date Card */}
            <Card className="bg-gradient-to-br from-[#ffffff] to-[#e8c58c]/20 border-2 border-[#fdb726]/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#fdb726] to-[#f5a623] flex items-center justify-center shadow-lg">
                    <Calendar className="h-6 w-6 text-[#000000]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#000000]/70 uppercase tracking-wide">
                      Joined
                    </p>
                    <p className="text-base font-bold text-[#000000]">
                      {driverData.joiningDate}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Completed Rides Card */}
            <Card className="bg-gradient-to-br from-[#ffffff] to-[#e8c58c]/20 border-2 border-[#fdb726]/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#fdb726] to-[#f5a623] flex items-center justify-center shadow-lg">
                      <Car className="h-6 w-6 text-[#000000]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#000000]/70 uppercase tracking-wide">
                        Completed
                      </p>
                      <p className="text-xl font-bold text-[#fdb726]">
                        {driverData.completedRides}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" className="bg-[#fdb726]/20 hover:bg-[#fdb726]/30 text-[#000000] text-xs font-bold border-2 border-[#fdb726]/30 rounded-xl px-3">
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Cancelled Rides Card */}
            <Card className="bg-gradient-to-br from-[#ffffff] to-[#e8c58c]/20 border-2 border-[#fdb726]/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#000000]/80 to-[#000000]/60 flex items-center justify-center shadow-lg">
                      <XCircle className="h-6 w-6 text-[#ffffff]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#000000]/70 uppercase tracking-wide">
                        Cancelled
                      </p>
                      <p className="text-xl font-bold text-[#000000]">
                        {driverData.cancelledRides}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" className="bg-[#fdb726]/20 hover:bg-[#fdb726]/30 text-[#000000] text-xs font-bold border-2 border-[#fdb726]/30 rounded-xl px-3">
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Wallet and Commission Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wallet Balance Card */}
            <Card className="bg-gradient-to-br from-[#fdb726] to-[#f5a623] border-2 border-[#000000]/10 shadow-2xl overflow-hidden rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-[#000000]">
                  <div className="h-10 w-10 rounded-xl bg-[#ffffff] flex items-center justify-center shadow-md">
                    <Wallet className="h-6 w-6 text-[#fdb726]" />
                  </div>
                  <span className="font-bold">Wallet Balance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-[#000000] mb-6">
                  ₹{driverData.walletBalance.toFixed(2)}
                </div>
                <Button className="w-full bg-[#000000] hover:bg-[#000000]/90 text-[#ffffff] font-bold py-6 text-base rounded-full shadow-xl">
                  View Transaction History
                </Button>
              </CardContent>
            </Card>

            {/* Admin Commission Card */}
            <Card className="bg-gradient-to-br from-[#ffffff] to-[#e8c58c]/30 border-2 border-[#fdb726]/30 shadow-2xl overflow-hidden rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-[#000000]">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#fdb726] to-[#f5a623] flex items-center justify-center shadow-md">
                    <CreditCard className="h-6 w-6 text-[#000000]" />
                  </div>
                  <span className="font-bold">Admin Commission Due</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-[#fdb726] mb-6">
                  ₹{driverData.adminCommission.toFixed(2)}
                </div>
                <Button className="w-full bg-gradient-to-r from-[#fdb726] to-[#f5a623] hover:from-[#f5a623] hover:to-[#fdb726] text-[#000000] font-bold py-6 text-base rounded-full shadow-xl border-2 border-[#000000]/10">
                  Pay Commission
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Warning Dialog */}
      {showWarning && (
        <Dialog open={showWarning} onOpenChange={setShowWarning}>
          <DialogContent className="bg-gradient-to-br from-[#ffffff] to-[#f5e5c8] border-2 border-[#fdb726] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#fdb726] to-[#f5a623] flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-[#000000]" />
                </div>
                <span className="text-[#000000] font-bold">Important Notice</span>
              </DialogTitle>
            </DialogHeader>
            <Alert className="border-2 border-[#fdb726]/30 bg-[#fdb726]/10 rounded-2xl">
              <AlertTriangle className="h-5 w-5 text-[#fdb726]" />
              <AlertDescription className="text-[#000000] font-medium ml-2">
                If you update this field, you will be logged out and can only
                log in after admin verification. You will receive an email
                notification once the verification is complete.
              </AlertDescription>
            </Alert>
            <div className="flex gap-3 mt-4">
              <Button
                onClick={() => handleEditConfirm(editingField)}
                className="flex-1 bg-gradient-to-r from-[#fdb726] to-[#f5a623] hover:from-[#f5a623] hover:to-[#fdb726] text-[#000000] font-bold py-6 rounded-full shadow-lg"
              >
                Continue
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowWarning(false);
                  setEditingField("");
                }}
                className="flex-1 border-2 border-[#000000]/20 hover:bg-[#000000]/10 text-[#000000] font-bold py-6 rounded-full"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DriverProfile;