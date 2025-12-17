import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import { Phone, Loader2, User, Car, MapPin } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { fetchData } from "@/shared/services/api/api-service";
import { AdminApiEndpoints } from "@/constants/admin-api-end-pointes";
import { Coordinates } from "@/shared/types/common";
import { coordinatesToAddress } from "@/shared/utils/locationToAddress";
import { useNavigate } from "react-router-dom";

interface Issue {
  id: string;
  rideId: string;
  note?: string;
  status: "Pending" | "Resolved" | "Reissued";
  user: {
    userId: string;
    userName: string;
    userNumber: string;
    userProfile: string;
  };
  driver: {
    driverId: string;
    driverName: string;
    driverNumber: string;
    driverProfile: string;
  };
  pickupCoordinates: {
    latitude: number;
    longitude: number;
    address: string;
  };
  dropOffCoordinates: {
    latitude: number;
    longitude: number;
    address: string;
  };
  currentLocation: Coordinates;
  createdAt: string;
}

interface IssuesListProps {
  issues: Issue[];
  status: "pending" | "resolved" | "reissued";
  loading?: boolean;
  onUpdateSuccess?: () => void;
}

const IssuesList: React.FC<IssuesListProps> = ({
  issues,
  status,
  loading = false,
  onUpdateSuccess,
}) => {
  const navigate = useNavigate();
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [detailsType, setDetailsType] = useState<
    "user" | "driver" | "route" | null
  >(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateNote, setUpdateNote] = useState("");
  const [updateStatus, setUpdateStatus] = useState<"Resolved" | "Reissued">(
    "Resolved"
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [currentLocationAddress, setCurrentLocationAddress] = useState<
    string | null
  >(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  const handleCall = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleNavigateToProfile = (type: "user" | "driver" | "route" | null, id: string) => {
    if (type === "user") {
      navigate(`/admin/users/${id}`);
    } else {
      navigate(`/admin/drivers/${id}`);
    }
  };

  const handleShowDetails = async (
    issue: Issue,
    type: "user" | "driver" | "route"
  ) => {
    setSelectedIssue(issue);
    setDetailsType(type);
console.log(issue.currentLocation?.latitude ,issue.currentLocation?.longitude,type);

    if (type === "route") {
      setCurrentLocationAddress(null);
      if (issue.currentLocation?.latitude && issue.currentLocation?.longitude) {
        setLoadingAddress(true);
        try {
          const address = await coordinatesToAddress(
            issue.currentLocation.latitude,
            issue.currentLocation.longitude
          );
          console.log("address",address);
          
          setCurrentLocationAddress(address);
        } catch (error) {
          console.error("Failed to fetch current location address:", error);
          setCurrentLocationAddress("Not available");
        } finally {
          setLoadingAddress(false);
        }
      }
    }
  };

  const handleUpdateClick = (issue: Issue) => {
    setSelectedIssue(issue);
    setUpdateNote("");
    setUpdateStatus("Resolved");
    setNoteError("");
    setUpdateDialogOpen(true);
  };

  const handleUpdateSubmit = async () => {
    if (!updateNote.trim()) {
      setNoteError("Note is required");
      return;
    }

    setIsUpdating(true);
    try {
      await fetchData(`${AdminApiEndpoints.ISSUES}/${selectedIssue?.id}`);
      setUpdateDialogOpen(false);
      onUpdateSuccess?.();
    } catch (error) {
      console.error("Failed to update issue:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mr-2 text-blue-600" />
        <span className="text-lg">Loading issues...</span>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          No {status} issues found.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile view */}
      <div className="lg:hidden space-y-4">
        {issues.map((issue) => (
          <Card key={issue.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">Ride ID</p>
                    <p className="font-semibold">{issue.rideId}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      issue.status === "Resolved"
                        ? "bg-green-100 text-green-800"
                        : issue.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {issue.status}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="text-sm">{formatTime(issue.createdAt)}</p>
                </div>

                {status === "resolved" && issue.note && (
                  <div>
                    <p className="text-sm text-muted-foreground">Note</p>
                    <p className="text-sm">{issue.note}</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShowDetails(issue, "user")}
                    className="text-xs"
                  >
                    <User className="mr-1 h-3 w-3" />
                    User
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShowDetails(issue, "driver")}
                    className="text-xs"
                  >
                    <Car className="mr-1 h-3 w-3" />
                    Driver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShowDetails(issue, "route")}
                    className="text-xs"
                  >
                    <MapPin className="mr-1 h-3 w-3" />
                    Route
                  </Button>
                </div>

                {status === "pending" && (
                  <Button
                    className="w-full"
                    onClick={() => handleUpdateClick(issue)}
                  >
                    Update Issue
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop view */}
      <div className="hidden lg:block rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[100px]">Ride ID</TableHead>
              <TableHead className="min-w-[150px]">Time</TableHead>
              <TableHead className="min-w-[250px]">Clients</TableHead>
              <TableHead className="min-w-[120px]">Route</TableHead>
              {status === "resolved" && (
                <TableHead className="min-w-[200px]">Note</TableHead>
              )}
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="min-w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell className="font-medium">{issue.rideId}</TableCell>
                <TableCell className="text-sm">
                  {formatTime(issue.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShowDetails(issue, "user")}
                    >
                      <User className="mr-1 h-4 w-4" />
                      User
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShowDetails(issue, "driver")}
                    >
                      <Car className="mr-1 h-4 w-4" />
                      Driver
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShowDetails(issue, "route")}
                  >
                    <MapPin className="mr-1 h-4 w-4" />
                    View
                  </Button>
                </TableCell>
                {status === "resolved" && (
                  <TableCell className="max-w-xs">
                    <p className="truncate">{issue.note || "N/A"}</p>
                  </TableCell>
                )}
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                      issue.status === "Resolved"
                        ? "bg-green-100 text-green-800"
                        : issue.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {issue.status}
                  </span>
                </TableCell>
                <TableCell>
                  {status === "pending" && (
                    <Button size="sm" onClick={() => handleUpdateClick(issue)}>
                      Update
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* User/Driver Details Dialog */}
      <Dialog
        open={detailsType === "user" || detailsType === "driver"}
        onOpenChange={() => setDetailsType(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {detailsType === "user" ? "User Details" : "Driver Details"}
            </DialogTitle>
          </DialogHeader>
          {selectedIssue && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={
                    detailsType === "user"
                      ? selectedIssue.user.userProfile
                      : selectedIssue.driver.driverProfile
                  }
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() =>
                    handleNavigateToProfile(
                      detailsType!,
                      detailsType === "user"
                        ? selectedIssue.user.userId
                        : selectedIssue.driver.driverId
                    )
                  }
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-lg truncate cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() =>
                      handleNavigateToProfile(
                        detailsType!,
                        detailsType === "user"
                          ? selectedIssue.user.userId
                          : selectedIssue.driver.driverId
                      )
                    }
                  >
                    {detailsType === "user"
                      ? selectedIssue.user.userName
                      : selectedIssue.driver.driverName}
                  </p>
                </div>
              </div>

              <div>
                <Label>Phone Number</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={
                      detailsType === "user"
                        ? selectedIssue.user.userNumber
                        : selectedIssue.driver.driverNumber
                    }
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    onClick={() =>
                      handleCall(
                        detailsType === "user"
                          ? selectedIssue.user.userNumber
                          : selectedIssue.driver.driverNumber
                      )
                    }
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Route Details Dialog */}
      <Dialog
        open={detailsType === "route"}
        onOpenChange={() => setDetailsType(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Route Details</DialogTitle>
          </DialogHeader>
          {selectedIssue && (
            <div className="space-y-6">
              <div className="space-y-4">
                {/* Pickup Location */}
                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-green-100 rounded-full p-2">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Pickup Location
                    </p>
                    <p className="text-sm font-semibold mb-1">
                      {selectedIssue.pickupCoordinates.address}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Lat: {selectedIssue.pickupCoordinates.latitude.toFixed(6)}
                      , Lng:{" "}
                      {selectedIssue.pickupCoordinates.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="border-l-2 border-dashed border-gray-300 h-8"></div>
                </div>

                {/* Current Location */}
                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-blue-100 rounded-full p-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Driver's Current Location
                    </p>
                    {selectedIssue.currentLocation?.latitude &&
                    selectedIssue.currentLocation?.longitude ? (
                      <>
                        {loadingAddress ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">
                              Loading address...
                            </span>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-semibold mb-1">
                              {currentLocationAddress ||
                                "Address not available"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Lat:{" "}
                              {selectedIssue.currentLocation.latitude.toFixed(
                                6
                              )}
                              , Lng:{" "}
                              {selectedIssue.currentLocation.longitude.toFixed(
                                6
                              )}
                            </p>
                          </>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Not available
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="border-l-2 border-dashed border-gray-300 h-8"></div>
                </div>

                {/* Drop-off Location */}
                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-red-100 rounded-full p-2">
                    <MapPin className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Drop-off Location
                    </p>
                    <p className="text-sm font-semibold mb-1">
                      {selectedIssue.dropOffCoordinates.address}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Lat:{" "}
                      {selectedIssue.dropOffCoordinates.latitude.toFixed(6)},
                      Lng:{" "}
                      {selectedIssue.dropOffCoordinates.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Issue Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Issue</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status *</Label>
              <select
                id="status"
                className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={updateStatus}
                onChange={(e) =>
                  setUpdateStatus(e.target.value as "Resolved" | "Reissued")
                }
              >
                <option value="Resolved">Resolved</option>
                <option value="Reissued">Reissued</option>
              </select>
            </div>

            <div>
              <Label htmlFor="note">Note *</Label>
              <Input
                id="note"
                placeholder="Enter note (required)"
                value={updateNote}
                onChange={(e) => {
                  setUpdateNote(e.target.value);
                  setNoteError("");
                }}
                className={noteError ? "border-red-500" : ""}
              />
              {noteError && (
                <p className="text-sm text-red-500 mt-1">{noteError}</p>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setUpdateDialogOpen(false)}
              disabled={isUpdating}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSubmit}
              disabled={isUpdating}
              className="w-full sm:w-auto"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default IssuesList;
