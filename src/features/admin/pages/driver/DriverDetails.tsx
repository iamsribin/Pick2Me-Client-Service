import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { ArrowLeft } from "lucide-react";
import AdminLayout from "@/features/admin/components/AdminLayout";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import DriverDetailsTab from "@/features/admin/components/DriverDetailsTab";
import DriverDocumentsTab from "@/features/admin/components/DriverDocumentsTab";
import DriverAccountTab from "@/features/admin/components/DriverAccountTab";
import {
  fetchData,
  patchData,
} from "@/shared/services/api/api-service";
import { ResponseCom } from "@/shared/types/common";
import { AdminApiEndpoints } from "@/constants/admin-api-end-pointes";
import { toast } from "@/shared/hooks/use-toast";
import { handleCustomError } from "@/shared/utils/error";
import { AdminDriverDetailsDTO } from "../../type";
import { AccountStatus } from "@/shared/types/driver/driver-type";
import GlobalLoading from "@/shared/components/loaders/GlobalLoading";

const PendingDriverDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [driver, setDriver] = useState<AdminDriverDetailsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | undefined>(
    undefined
  );
  const [isRejecting, setIsRejecting] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchDriver = async () => {
      try {
        if (!id) {
          toast({ description: "id is missing", variant: "error" });
          return;
        }
        setLoading(true);
        const res = await fetchData<ResponseCom["data"]>(
          AdminApiEndpoints.DRIVER.replace(":id", id),
          signal
        );

        const data = res?.data;

        if (res?.status == 200) {
          setDriver(data);
        }
      } catch (error: any) {
        handleCustomError(error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDriver();
    }

    return () => controller.abort();
  }, [id, dispatch]);

  const handleVerification = async (
    status: "Rejected" | "Good" | "Blocked",
    fields?: string[]
  ) => {
    if (!note.trim()) {
      toast({ description: "Please provide a note", variant: "error" });
      return;
    }

    if (status === "Rejected" && (!fields || fields.length === 0)) {
      toast({
        description: "Please select at least one document for resubmission",
        variant: "error",
      });
      return;
    }

    if (!id) {
      toast({ description: "driver id is missing", variant: "error" });
      return;
    }

    const payload =
      status === "Rejected"
        ? { status: "Rejected", note: note.trim(), fields }
        : { status, note: note.trim() };

    try {
      setLoading(true)
      const res = await patchData<ResponseCom["data"]>(
        AdminApiEndpoints.DRIVER_STATUS.replace(":driverId", id),
        payload
      );
      if (res && res.status === 200 && status !=="Rejected") {
        toast({
          description: `Driver ${status} successfully`, variant: "success",
        });
        setNote("");
        setDriver((prev) =>
          prev ? { ...prev, accountStatus: status as AccountStatus } : prev
        );
      }else if(status == "Rejected"){
        toast({description:"Driver request rejected successfully"});
        navigate("/admin/drivers")
      }
    } catch (error) {
      handleCustomError(error);
    }finally{
      setLoading(false)
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <GlobalLoading isLoading={loading} loadingType="profile"/>
      </AdminLayout>
    );
  }

  if (!driver) {
    return (
      <AdminLayout>
        <div className="flex flex-col justify-center items-center h-full text-gray-600">
          <div className="text-xl mb-2">Driver not found</div>
          <Button onClick={() => navigate("/admin/drivers")} variant="outline">
            Back to Drivers List
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="h-full overflow-auto p-4 sm:p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              className="text-gray-600 hover:bg-gray-100 rounded-full p-2"
              onClick={() => navigate("/admin/drivers")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="text-right">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                {driver.name}
              </h1>
              <p className="text-sm text-gray-500 capitalize">
                Status: {driver.accountStatus || "Unknown"}
              </p>
            </div>
          </div>

          <Card className="bg-white border border-gray-200 shadow-md rounded-2xl overflow-hidden">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid grid-cols-3 bg-gray-100 p-2 rounded-t-2xl">
                <TabsTrigger
                  value="details"
                  className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs sm:text-sm"
                >
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="documents"
                  className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs sm:text-sm"
                >
                  Documents
                </TabsTrigger>
                <TabsTrigger
                  value="account"
                  className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs sm:text-sm"
                >
                  Account
                </TabsTrigger>
              </TabsList>

              <DriverDetailsTab
                driver={driver}
                note={note}
                setNote={setNote}
                isRejecting={isRejecting}
                setIsRejecting={setIsRejecting}
                selectedFields={selectedFields}
                setSelectedFields={setSelectedFields}
                handleVerification={handleVerification}
              />

              <DriverDocumentsTab
                driver={driver}
                setSelectedImage={setSelectedImage}
              />

              <DriverAccountTab driver={driver} />
            </Tabs>
          </Card>
        </div>
      </div>

      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(undefined)}
      >
        <DialogContent className="max-w-4xl bg-white border-none rounded-2xl p-0">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Zoomed document"
              className="w-full h-auto rounded-2xl"
              onError={(e) => {
                e.currentTarget.src = "/placeholder-image.png";
                console.error("Error loading image:", selectedImage);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default PendingDriverDetails;
