import React, { useEffect, useState } from "react";
import {
  FileText,
  Edit3,
  Calendar,
  AlertTriangle,
  X,
  Eye,
  ZoomIn,
  Save,
  XCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
} from "lucide-react";
import DriverNavbar from "../components/DriverNavbar";
import { StatusCode } from "@/shared/types/enum";
import { deleteData, fetchData, updateData } from "@/shared/services/api/api-service";
import DriverApiEndpoints from "@/constants/driver-api-end-pontes";
import { ResponseCom } from "@/shared/types/common";
import { handleCustomError } from "@/shared/utils/error";
import { toast } from "@/shared/hooks/use-toast";
import { store } from "@/shared/services/redux/store";
import { userLogout } from "@/shared/services/redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/shared/utils/format";
import { DocumentStatus, DriverData, ImageModal, FormData as DocFormData, ImagePreview, DocumentConfig } from "./type";
import GlobalLoading from "@/shared/components/loaders/GlobalLoading";

const DriverDocuments: React.FC = () => {
  const [driverData, setDriverData] = useState<DriverData | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<DocFormData>({});
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [imageModal, setImageModal] = useState<ImageModal>({
    images: [],
    currentIndex: 0,
    title: "",
    isOpen: false,
  });
  const [imagePreviews, setImagePreviews] = useState<ImagePreview>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDriverDocuments = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchData<DriverData>(
          DriverApiEndpoints.MY_DOCUMENTS,
        );
        if (res?.status === StatusCode.OK && res.data) {
          setDriverData(res.data);
        }
      } catch (err) {
        setError("Failed to fetch driver documents");
        handleCustomError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDriverDocuments();
  }, []);

  // Utility functions
  const getExpiryStatus = (date: Date): DocumentStatus => {
    const now = new Date();
    const expiryDate = new Date(date);
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (expiryDate < now) return "expired";
    if (expiryDate < oneWeekFromNow) return "expiring";
    return "valid";
  };

  const getStatusColor = (status: DocumentStatus): string => {
    const statusColors = {
      expired: "border-red-500/30 bg-red-50/50",
      expiring: "border-[#fdb726] bg-[#fdb726]/10",
      valid: "border-[#fdb726]/20 bg-gradient-to-br from-[#ffffff] to-[#f5e5c8]/30",
    };
    return statusColors[status];
  };

  const getStatusBadge = (status: DocumentStatus): JSX.Element => {
    const badges = {
      expired: (
        <span className="px-3 py-1.5 text-xs font-bold text-[#000000] bg-red-500 rounded-full inline-flex items-center gap-1 shadow-md">
          <XCircle className="h-3 w-3" />
          Expired
        </span>
      ),
      expiring: (
        <span className="px-3 py-1.5 text-xs font-bold text-[#000000] bg-[#fdb726] rounded-full inline-flex items-center gap-1 shadow-md">
          <Clock className="h-3 w-3" />
          Expires Soon
        </span>
      ),
      valid: (
        <span className="px-3 py-1.5 text-xs font-bold text-[#000000] bg-gradient-to-r from-[#34d399] to-[#10b981] rounded-full inline-flex items-center gap-1 shadow-md">
          <CheckCircle className="h-3 w-3" />
          Valid
        </span>
      ),
    };
    return badges[status];
  };

  // Event handlers
  const handleEdit = (section: string): void => {
    setEditingSection(section);
    setShowWarning(true);
  };

  const handleContinueEdit = (): void => {
    setShowWarning(false);
    initializeFormData();
  };

  const initializeFormData = (): void => {
    if (!driverData || !editingSection) return;

    const formDataMap: Record<string, any> = {
      aadhar: {
        id: driverData.aadhar.id,
        frontImageUrl: null,
        backImageUrl: null,
      },
      license: {
        id: driverData.license.id,
        validity: driverData.license.validity.toISOString().split("T")[0],
        frontImageUrl: null,
        backImageUrl: null,
      },
      vehicleRC: {
        registrationId: driverData.vehicleRC.registrationId,
        rcStartDate: driverData.vehicleRC.rcStartDate.toISOString().split("T")[0],
        rcExpiryDate: driverData.vehicleRC.rcExpiryDate.toISOString().split("T")[0],
        rcFrontImageUrl: null,
        backImageUrl: null,
      },
      vehicleDetails: {
        vehicleNumber: driverData.vehicleDetails.vehicleNumber,
        vehicleColor: driverData.vehicleDetails.vehicleColor,
        model: driverData.vehicleDetails.model,
        carFrontImage: null,
        carBackImage: null,
      },
      insurance: {
        insuranceStartDate: driverData.insurance.insuranceStartDate.toISOString().split("T")[0],
        insuranceExpiryDate: driverData.insurance.insuranceExpiryDate.toISOString().split("T")[0],
        insuranceImage: null,
      },
      pollution: {
        pollutionStartDate: driverData.pollution.pollutionStartDate.toISOString().split("T")[0],
        pollutionExpiryDate: driverData.pollution.pollutionExpiryDate.toISOString().split("T")[0],
        pollutionImage: null,
      },
    };

    setEditFormData(formDataMap[editingSection] || {});
  };

  const handleCancelEdit = (): void => {
    setEditingSection(null);
    setEditFormData({});
    setShowWarning(false);
    setImagePreviews({});
  };

  const handleInputChange = (field: string, value: string): void => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: string, file: File | null): void => {
    setEditFormData((prev) => ({ ...prev, [field]: file }));

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (result) {
          setImagePreviews((prev) => ({ ...prev, [field]: result as string }));
        }
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreviews((prev) => {
        const newPreviews = { ...prev };
        delete newPreviews[field];
        return newPreviews;
      });
    }
  };

  const handleSubmit = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (!editingSection) return;
      formData.append("section", editingSection);

      for (const [key, value] of Object.entries(editFormData)) {
        if (value instanceof File || typeof value === "string") {
          formData.append(key, value);
        }
      }

      const res = await updateData<ResponseCom["data"]>(DriverApiEndpoints.MY_DOCUMENTS, formData);

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
      setIsSubmitting(false);
    }
  };

  const openImageModal = (images: string[], title: string): void => {
    const validImages = images.filter((img) => img && img.trim() !== "");
    setImageModal({
      images: validImages,
      currentIndex: 0,
      title,
      isOpen: true,
    });
  };

  const closeImageModal = (): void => {
    setImageModal((prev) => ({ ...prev, isOpen: false }));
  };

  const nextImage = (): void => {
    setImageModal((prev) => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.images.length,
    }));
  };

  const prevImage = (): void => {
    setImageModal((prev) => ({
      ...prev,
      currentIndex: prev.currentIndex === 0 ? prev.images.length - 1 : prev.currentIndex - 1,
    }));
  };

  // Loading and error states

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#e8c58c] via-[#f5e5c8] to-[#ffffff] pb-20 sm:pb-4 sm:pl-64">
        <DriverNavbar />
        <GlobalLoading
        isLoading={loading}
        loadingMessage="loading documents"
      />
      </div>
    );
  }

  if (error || !driverData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#e8c58c] via-[#f5e5c8] to-[#ffffff] pb-20 sm:pb-4 sm:pl-64">
        <DriverNavbar />
        <div className="p-4 max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-red-600 font-bold">
              {error || "No driver data available"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Component configurations
  const documentConfigs: DocumentConfig[] = [
    {
      key: "aadhar",
      title: "Aadhar Card",
      data: driverData.aadhar,
      fields: [{ key: "id", label: "Aadhar Number", type: "text" }],
      images: [
        { key: "frontImageUrl", label: "Front Image", url: "frontImageUrl" },
        { key: "backImageUrl", label: "Back Image", url: "backImageUrl" },
      ],
      displayData: [{ label: "ID", value: driverData.aadhar.id }],
    },
    {
      key: "license",
      title: "License",
      data: driverData.license,
      status: getExpiryStatus(driverData.license.validity),
      fields: [
        { key: "id", label: "License Number", type: "text" },
        { key: "validity", label: "Validity Date", type: "date" },
      ],
      images: [
        { key: "frontImageUrl", label: "Front Image", url: "frontImageUrl" },
        { key: "backImageUrl", label: "Back Image", url: "backImageUrl" },
      ],
      displayData: [
        { label: "ID", value: driverData.license.id },
        {
          label: "Validity",
          value: formatDate(driverData.license.validity),
          icon: Calendar,
        },
      ],
    },
    {
      key: "vehicleRC",
      title: "Vehicle RC",
      data: driverData.vehicleRC,
      status: getExpiryStatus(driverData.vehicleRC.rcExpiryDate),
      fields: [
        { key: "registrationId", label: "Registration ID", type: "text" },
        { key: "rcStartDate", label: "Start Date", type: "date" },
        { key: "rcExpiryDate", label: "Expiry Date", type: "date" },
      ],
      images: [
        { key: "rcFrontImageUrl", label: "Front Image", url: "rcFrontImageUrl" },
        { key: "rcBackImageUrl", label: "Back Image", url: "rcBackImageUrl" },
      ],
      displayData: [
        { label: "ID", value: driverData.vehicleRC.registrationId },
        { label: "Start", value: formatDate(driverData.vehicleRC.rcStartDate) },
        {
          label: "Expiry",
          value: formatDate(driverData.vehicleRC.rcExpiryDate),
          status: getExpiryStatus(driverData.vehicleRC.rcExpiryDate),
        },
      ],
    },
    {
      key: "vehicleDetails",
      title: "Vehicle Photos",
      data: driverData.vehicleDetails,
      fields: [
        { key: "vehicleNumber", label: "Vehicle Number", type: "text" },
        { key: "vehicleColor", label: "Vehicle Color", type: "text" },
        { key: "model", label: "Model", type: "text" },
      ],
      images: [
        { key: "carFrontImageUrl", label: "Front Image", url: "carFrontImageUrl" },
        { key: "carBackImageUrl", label: "Back Image", url: "carBackImageUrl" },
      ],
      displayData: [
        { label: "Vehicle Number", value: driverData.vehicleDetails.vehicleNumber },
        { label: "Color", value: driverData.vehicleDetails.vehicleColor },
        { label: "Model", value: driverData.vehicleDetails.model },
      ],
    },
    {
      key: "insurance",
      title: "Insurance",
      data: driverData.insurance,
      status: getExpiryStatus(driverData.insurance.insuranceExpiryDate),
      fields: [
        { key: "insuranceStartDate", label: "Start Date", type: "date" },
        { key: "insuranceExpiryDate", label: "Expiry Date", type: "date" },
      ],
      images: [
        { key: "insuranceImageUrl", label: "Insurance Document", url: "insuranceImageUrl" },
      ],
      displayData: [
        { label: "Start", value: formatDate(driverData.insurance.insuranceStartDate) },
        {
          label: "Expiry",
          value: formatDate(driverData.insurance.insuranceExpiryDate),
          status: getExpiryStatus(driverData.insurance.insuranceExpiryDate),
        },
      ],
    },
    {
      key: "pollution",
      title: "Pollution Certificate",
      data: driverData.pollution,
      status: getExpiryStatus(driverData.pollution.pollutionExpiryDate),
      fields: [
        { key: "pollutionStartDate", label: "Start Date", type: "date" },
        { key: "pollutionExpiryDate", label: "Expiry Date", type: "date" },
      ],
      images: [
        { key: "pollutionImageUrl", label: "Pollution Certificate", url: "pollutionImageUrl" },
      ],
      displayData: [
        { label: "Start", value: formatDate(driverData.pollution.pollutionStartDate) },
        {
          label: "Expiry",
          value: formatDate(driverData.pollution.pollutionExpiryDate),
          status: getExpiryStatus(driverData.pollution.pollutionExpiryDate),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e8c58c] via-[#f5e5c8] to-[#ffffff] pb-20 sm:pb-4 sm:pl-64">
      <DriverNavbar />
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#000000] mb-2">
            My Documents
          </h1>
          <p className="text-[#000000]/70 font-medium">
            Manage and update your driving documents
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
{documentConfigs.map((config) => (
  <div
    key={config.key}
    className={`p-6 rounded-3xl shadow-xl border-2 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${getStatusColor(
      config.status || "valid"
    )}`}
  >
    {/* TOP: Icon + File Name + Status Badge */}
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#fdb726] to-[#f5a623] flex items-center justify-center shadow-lg">
          <FileText className="w-5 h-5 text-[#000000]" />
        </div>
        <div className="flex flex-col">
          <h3 className="text-lg font-bold text-[#000000]">
            {config.title}
          </h3>
        </div>
      </div>

      {/* keep the top area minimal — badge only */}
      <div>{getStatusBadge(config.status || "valid")}</div>
    </div>

    {/* BODY: either edit form or display data + images */}
    {editingSection === config.key ? (
      <div className="space-y-4">
        {config.fields.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-bold text-[#000000]/80 mb-2">
              {field.label}
            </label>
            <input
              type={field.type}
              value={(editFormData[field.key as keyof DocFormData] as string) || ""}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              className="w-full px-4 py-3 border-2 border-[#fdb726]/30 rounded-2xl focus:ring-2 focus:ring-[#fdb726] focus:border-[#fdb726] bg-[#ffffff] text-[#000000] font-medium"
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          </div>
        ))}
        <div className={config.images.length > 1 ? "grid grid-cols-2 gap-4" : ""}>
          {config.images.map((image) => (
            <div key={image.key}>
              <label className="block text-sm font-bold text-[#000000]/80 mb-2">
                {image.label}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(image.key, e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border-2 border-[#fdb726]/30 rounded-2xl focus:ring-2 focus:ring-[#fdb726] text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-[#fdb726] file:text-[#000000] file:font-bold hover:file:bg-[#f5a623] cursor-pointer"
              />
              {imagePreviews[image.key] && (
                <img
                  src={imagePreviews[image.key]}
                  alt="Preview"
                  className="mt-3 w-full h-24 object-cover rounded-2xl border-2 border-[#fdb726]/30"
                />
              )}
            </div>
          ))}
        </div>

        {/* Footer when editing: Update / Cancel (same as before) */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 flex-1 px-4 py-3 bg-gradient-to-r from-[#fdb726] to-[#f5a623] hover:from-[#f5a623] hover:to-[#fdb726] text-[#000000] font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "Updating..." : "Update"}
          </button>
          <button
            onClick={handleCancelEdit}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#000000]/80 hover:bg-[#000000] text-[#ffffff] font-bold rounded-full transition-all duration-300 shadow-lg"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    ) : (
      <div>
        <div className="space-y-3 mb-5">
          {config.displayData.map((item, index) => (
            <div
              key={index}
              className={`flex items-center text-sm font-medium ${
                item.status === "expired"
                  ? "text-red-600"
                  : item.status === "expiring"
                  ? "text-[#fdb726]"
                  : "text-[#000000]/80"
              }`}
            >
              {item.icon && (
                <div className="h-8 w-8 rounded-lg bg-[#fdb726]/20 flex items-center justify-center mr-2">
                  <item.icon className="w-4 h-4" />
                </div>
              )}
              <span className="font-bold">{item.label}:</span>
              <span className="ml-2">{item.value}</span>
              {item.status && item.status !== "valid" && (
                <AlertTriangle className="w-4 h-4 ml-2" />
              )}
            </div>
          ))}
        </div>

        <div className={config.images.length > 1 ? "grid grid-cols-2 gap-4" : "text-center"}>
          {config.images.map((image) => {
            const imageUrl = (config.data as any)[image.url];
            return (
              <div key={image.key} className="text-center">
                <p className="text-xs font-bold text-[#000000]/70 mb-2">
                  {image.label}
                </p>
                <div className="relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-[#fdb726]/30 hover:border-[#fdb726] transition-all duration-300">
                  <img
                    src={imageUrl}
                    alt={image.label}
                    className="w-full h-28 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-[#000000] bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-300 flex items-center justify-center">
                    <ZoomIn className="text-[#ffffff] opacity-0 group-hover:opacity-100 transition-opacity duration-300" size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FOOTER: View All Images + Edit (moved here) */}
        <div className="flex justify-center gap-4 mt-5">
          <button
            onClick={() =>
              openImageModal(
                config.images.map((img) => (config.data as any)[img.url] as string),
                config.title
              )
            }
            className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-[#000000] bg-[#fdb726]/20 border-2 border-[#fdb726]/30 rounded-full hover:bg-[#fdb726]/30 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <Eye className="w-4 h-4" />
            View
          </button>

          <button
            onClick={() => handleEdit(config.key)}
            className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-[#000000] bg-[#fdb726]/20 border-2 border-[#fdb726]/30 rounded-full hover:bg-[#fdb726]/30 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
        </div>
      </div>
    )}
  </div>
))}

        </div>

        {/* Image Modal */}
        {imageModal.isOpen && (
          <div className="fixed inset-0 bg-[#000000]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-[#ffffff] to-[#f5e5c8] rounded-3xl max-w-4xl w-full p-6 sm:p-8 relative shadow-2xl border-2 border-[#fdb726]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#000000]">
                  {imageModal.title}
                </h2>
                <button
                  onClick={closeImageModal}
                  className="text-[#000000] hover:bg-[#fdb726]/20 p-2 rounded-full transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="relative">
                <img
                  src={imageModal.images[imageModal.currentIndex]}
                  alt={`${imageModal.title} ${imageModal.currentIndex + 1}`}
                  className="w-full max-h-[70vh] object-contain rounded-2xl border-2 border-[#fdb726]/30"
                />
                {imageModal.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-[#fdb726] text-[#000000] p-3 rounded-full hover:bg-[#f5a623] transition-all shadow-xl"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-[#fdb726] text-[#000000] p-3 rounded-full hover:bg-[#f5a623] transition-all shadow-xl"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
              <p className="text-center mt-4 text-sm font-bold text-[#000000]/70">
                Image {imageModal.currentIndex + 1} of {imageModal.images.length}
              </p>
            </div>
          </div>
        )}

        {/* Warning Modal */}
        {showWarning && (
          <div className="fixed inset-0 bg-[#000000]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-[#ffffff] to-[#f5e5c8] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-2 border-[#fdb726]">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#fdb726] to-[#f5a623] flex items-center justify-center shadow-lg">
                  <AlertTriangle className="w-6 h-6 text-[#000000]" />
                </div>
                <h2 className="text-xl font-bold text-[#000000]">Important Notice</h2>
              </div>
              <p className="text-sm font-medium text-[#000000]/80 mb-6 leading-relaxed">
                Updating your documents will require admin verification. You will be logged out after submission until verification is complete.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleContinueEdit}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-[#fdb726] to-[#f5a623] hover:from-[#f5a623] hover:to-[#fdb726] text-[#000000] font-bold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Continue
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 px-6 py-4 bg-[#000000]/80 hover:bg-[#000000] text-[#ffffff] font-bold rounded-full transition-all duration-300 shadow-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDocuments;