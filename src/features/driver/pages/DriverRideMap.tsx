// import React, { useEffect, useState } from "react";
// import { useSelector } from "react-redux";
// import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
// import { RootState } from "@/shared/services/redux/store";
// // import TripInfo from "@/features/driver/components/TripInfo";
// import ChatSection from "@/features/driver/components/ChatSection";
// import useMap from "@/shared/hooks/useMap";
// // import useRideSocket from "@/shared/hooks/useRideSocket";
// import { useNavigate } from "react-router-dom";

// const DriverRideMap: React.FC = () => {
//   const { isOpen, rideData } = useSelector((state: RootState) => state.driverRideMap);
  
//   const [activeSection, setActiveSection] = useState<"info" | "messages">("info");
//   const [unreadCount, setUnreadCount] = useState(0);

//   const { mapContainerRef, mapReady } = useMap(rideData);
//   // useRideSocket(rideData, activeSection, setUnreadCount);
//     const navigate = useNavigate();
  
//       useEffect(() => {
//     if (!rideData || !isOpen) {
//       navigate("/driver/dashboard");
//     }
//   }, [isOpen, navigate]);

//   if (!rideData || !isOpen) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
//           <p>Loading ride data...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col h-screen bg-gray-50">
//       <div className="relative flex-1 min-h-0">
//         <div ref={mapContainerRef} className="w-full h-full" />
//         {!mapReady && (
//           <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
//             <div className="text-center">
//               {import.meta.env.VITE_MAP_BOX_ACCESS_TOKEN ? (
//                 <>
//                   <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
//                   <p className="text-gray-600">Loading map...</p>
//                 </>
//               ) : (
//                 <p className="text-red-600">Map cannot load: Missing Mapbox access token.</p>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//       <Card className="border-0 rounded-t-xl shadow-none flex-shrink-0 bg-white shadow-lg max-h-[50vh] overflow-y-auto">
//         <CardHeader className="pb-3 px-4 pt-4">
//           <CardTitle className="text-base sm:text-lg flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <span className="truncate">{rideData.bookingDetails.status}</span>
//             </div>
//           </CardTitle>
//           <div className="flex border-b border-gray-200">
//             <button
//               onClick={() => setActiveSection("info")}
//               className={`flex-1 py-2 text-sm font-medium ${
//                 activeSection === "info"
//                   ? "text-blue-600 border-b-2 border-blue-600"
//                   : "text-gray-500 hover:text-gray-700"
//               }`}
//             >
//               Trip Info
//             </button>
//             <button
//               onClick={() => {
//                 setActiveSection("messages");
//                 setUnreadCount(0);
//               }}
//               className={`flex-1 py-2 text-sm font-medium ${
//                 activeSection === "messages"
//                   ? "text-blue-600 border-b-2 border-blue-600"
//                   : "text-gray-500 hover:text-gray-700"
//               }`}
//             >
//               Messages
//               {unreadCount > 0 && (
//                 <span className="ml-2 inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full">
//                   {unreadCount > 9 ? "9+" : unreadCount}
//                 </span>
//               )}
//             </button>
//           </div>
//         </CardHeader>
//         <CardContent className="px-4 pb-4 space-y-4">
//           {/* {activeSection === "info" && <TripInfo rideData={rideData} />}
//           {activeSection === "messages" && (
//             <ChatSection rideData={rideData} setUnreadCount={setUnreadCount} />
//           )} */}
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default DriverRideMap;