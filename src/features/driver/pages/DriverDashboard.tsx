import React, { useCallback } from "react";
import { Switch } from "@/shared/components/ui/switch";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { CircleDollarSign, Clock, Navigation2, Star } from "lucide-react";
import DriverNavbar from "../components/DriverNavbar";
import { RootState, store } from "@/shared/services/redux/store";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "@/shared/hooks/use-toast";
import { emitSocket } from "@/shared/utils/emitSocket";
import { postData } from "@/shared/services/api/api-service";
import DriverApiEndpoints from "@/constants/driver-api-end-pontes";

const DriverDashboard = () => {
  const dispatch = useDispatch();
  
  // const driverId = useSelector((state) => state.user.id);
  // const isOnline = useSelector((state) => state.user.isOnline);
  // const rideData = useSelector((state: RootState) => state.driverRideMap);
  const isOpen = useSelector((state: RootState) => state.RideData);

  const [online, setOnline] = React.useState(false);

  const handleOnlineChange = useCallback(async (checked:boolean) => {
    if (isOpen) {
      toast({description: "You can't go offline while you're on a ride.", variant: "error"});
      return;
    }

    store.dispatch(emitSocket("hello",{msg:"Hello from client"}));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log("Location:", latitude, longitude);
          postData(DriverApiEndpoints.ONLINE_STATUS,{ latitude, longitude });
          setOnline(checked);
        },
        (error) => {
          toast({description: "Please enable location access", variant: "error"});
        }
      );
    } else {
      toast({description: "Geolocation is not supported by your browser", variant: "error"});
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e8c58c] via-[#f5e5c8] to-[#ffffff] flex flex-col">
      <DriverNavbar/>
      <div className="h-16 sm:h-0"></div>
      
      <div className="flex-1 p-4 sm:p-6 md:p-8 ml-0 sm:ml-64">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-[#fdb726] to-[#f5a623] shadow-2xl rounded-2xl mb-6 border-2 border-[#fdb726]/30">
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#000000] drop-shadow-sm">
                Driver Dashboard
              </h1>
              <p className="mt-2 text-sm text-[#000000]/80 font-medium">Welcome back, Driver</p>
            </div>
            <div className="flex items-center gap-4 bg-[#ffffff]/90 px-6 py-3 rounded-full shadow-lg border-2 border-[#000000]/10">
              <span
                className={`text-sm font-bold ${
                  online ? "text-[#fdb726]" : "text-[#000000]/50"
                }`}
              >
                {online ? "● ONLINE" : "○ OFFLINE"}
              </span>
              <Switch
                checked={online}
                onCheckedChange={handleOnlineChange}
                className="data-[state=checked]:bg-[#fdb726]"
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <Card className="bg-gradient-to-br from-[#ffffff] to-[#e8c58c]/30 border-2 border-[#fdb726]/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#000000]/70 uppercase tracking-wide">
                    Today's Earnings
                  </p>
                  <h3 className="text-3xl font-bold mt-2 text-[#fdb726]">₹2,450</h3>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-[#fdb726] to-[#f5a623] rounded-2xl flex items-center justify-center shadow-lg">
                  <CircleDollarSign className="h-7 w-7 text-[#ffffff]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#ffffff] to-[#e8c58c]/30 border-2 border-[#fdb726]/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#000000]/70 uppercase tracking-wide">
                    Completed Rides
                  </p>
                  <h3 className="text-3xl font-bold mt-2 text-[#fdb726]">8</h3>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-[#fdb726] to-[#f5a623] rounded-2xl flex items-center justify-center shadow-lg">
                  <Navigation2 className="h-7 w-7 text-[#ffffff]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#ffffff] to-[#e8c58c]/30 border-2 border-[#fdb726]/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#000000]/70 uppercase tracking-wide">
                    Online Hours
                  </p>
                  <h3 className="text-3xl font-bold mt-2 text-[#fdb726]">6.5h</h3>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-[#fdb726] to-[#f5a623] rounded-2xl flex items-center justify-center shadow-lg">
                  <Clock className="h-7 w-7 text-[#ffffff]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#ffffff] to-[#e8c58c]/30 border-2 border-[#fdb726]/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#000000]/70 uppercase tracking-wide">
                    Rating
                  </p>
                  <h3 className="text-3xl font-bold mt-2 text-[#fdb726]">4.8</h3>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-[#fdb726] to-[#f5a623] rounded-2xl flex items-center justify-center shadow-lg">
                  <Star className="h-7 w-7 text-[#ffffff]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Cards */}
        {!isOpen && online && (
          <Card className="mb-6 bg-gradient-to-br from-[#fdb726] to-[#f5a623] border-2 border-[#000000]/10 shadow-2xl">
            <CardContent className="py-12 text-center">
              <Badge
                variant="secondary"
                className="mb-4 bg-[#ffffff] text-[#fdb726] px-6 py-2 text-base font-bold shadow-lg"
              >
                ONLINE
              </Badge>
              <h3 className="text-2xl font-bold mb-3 text-[#000000]">
                Looking for rides...
              </h3>
              <p className="text-[#000000]/80 font-medium text-lg">
                Stay online to receive ride requests in your area
              </p>
            </CardContent>
          </Card>
        )}

        {!isOpen && !online && (
          <Card className="mb-6 bg-gradient-to-br from-[#ffffff] to-[#e8c58c]/50 border-2 border-[#000000]/10 shadow-2xl">
            <CardContent className="py-12 text-center">
              <Badge 
                variant="secondary" 
                className="mb-4 bg-[#000000]/10 text-[#000000] px-6 py-2 text-base font-bold"
              >
                OFFLINE
              </Badge>
              <h3 className="text-2xl font-bold mb-3 text-[#000000]">
                You're currently offline
              </h3>
              <p className="text-[#000000]/70 mb-6 font-medium text-lg">
                Go online to start receiving ride requests
              </p>
              <Button
                onClick={() => handleOnlineChange(true)}
                className="bg-gradient-to-r from-[#fdb726] to-[#f5a623] hover:from-[#f5a623] hover:to-[#fdb726] text-[#000000] font-bold px-8 py-6 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-[#000000]/10"
              >
                Go Online
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;