// import React, { useEffect, useState } from 'react';
// import { Button } from '@/shared/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
// import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
// import { MapPin, Timer, ArrowDown, Car, Clock, IndianRupee } from 'lucide-react';
// import { Progress } from '@/shared/components/ui/progress';
// import { useDispatch, useSelector } from 'react-redux';
// import { RootState } from '@/shared/services/redux/store';
// import { hideRideRequestNotification, showRideMap } from '@/shared/services/redux/slices/driverRideSlice';
// import { useSocket } from '@/context/socket-context';
// import { useLoading } from '@/shared/hooks/useLoading';

// const RideNotification: React.FC = () => {
//   const dispatch = useDispatch();
//   const { socket } = useSocket();
//     const { showLoading, hideLoading } = useLoading();
  

//   const notificationData = useSelector((state: RootState) => state.driverRideMap.notificationData);
//   const isOpen = useSelector((state: RootState) => state.driverRideMap.isRideNotificationOpen);

//   // countdown state
//   const [timeLeft, setTimeLeft] = useState(30);

//   // progress bar state (0–100)
//   const [progressValue, setProgressValue] = useState(100);

//   const bookingId = notificationData?.bookingDetails.bookingId;

//   // Accept Ride
//   const onAccept = () => {
//     if (bookingId && socket) {
//       socket.emit("booking:accept", { bookingId });
//       showLoading({
//         isLoading: true,
//         loadingMessage: "please wait",
//         loadingType: "ride-request",
//       })
//     }
//   };

//   // Decline Ride
//   const onDecline = () => {
//     if (bookingId && socket) {
//       socket.emit("booking:reject", { bookingId });
//       dispatch(hideRideRequestNotification());
//     }
//   };

//   // Timer effect
//   useEffect(() => {
//     if (!isOpen) return;

//     setTimeLeft(30);
//     setProgressValue(100);

//     const interval = setInterval(() => {
//       setTimeLeft((prev) => {
//         if (prev <= 1) {
//           clearInterval(interval);
//           onDecline(); // auto reject
//           return 0;
//         }
//         return prev - 1;
//       });
//       setProgressValue((prev) => prev - 100 / 30);
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [isOpen]);

//   if (!isOpen || !notificationData) return null;

//   const { customer, bookingDetails } = notificationData;
//   const pickup = bookingDetails.pickupLocation;
//   const dropoff = bookingDetails.dropoffLocation;
//   const ride = bookingDetails;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
//       <div className="w-full max-w-sm mx-auto">
//         <Card className="w-full shadow-2xl border-0 overflow-hidden animate-in zoom-in-95 duration-300">
//           {/* Header with Timer */}
//           <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4">
//             <div className="flex justify-between items-center mb-3">
//               <CardTitle className="text-lg font-bold">New Ride Request</CardTitle>
//               <div className="flex items-center gap-2 bg-white bg-opacity-20 px-3 py-1 rounded-full">
//                 <Timer className="h-4 w-4" />
//                 <span className={`text-sm font-bold ${timeLeft <= 5 ? 'text-yellow-200 animate-pulse' : 'text-white'}`}>
//                   {timeLeft}s
//                 </span>
//               </div>
//             </div>
//             <Progress value={progressValue} className="h-2 bg-white bg-opacity-30" />
//           </CardHeader>

//           {/* Content */}
//           <CardContent className="p-4 bg-white">
//             {/* Customer Info */}
//             <div className="flex items-center mb-5">
//               <Avatar className="h-16 w-16 mr-4 border-2 border-green-100">
//                 <AvatarImage src={customer.userProfile} alt={customer.userName} />
//                 <AvatarFallback className="bg-green-50 text-green-600 text-xl font-bold">
//                   {customer.userName.charAt(0).toUpperCase()}
//                 </AvatarFallback>
//               </Avatar>
//               <div className="flex-1">
//                 <h3 className="font-bold text-xl text-gray-900">{customer.userName}</h3>
//                 <p className="text-sm text-gray-500 font-medium">Passenger</p>
//               </div>
//             </div>

//             {/* Trip Details */}
//             <div className="space-y-4 mb-5">
//               {/* Pickup */}
//               <div className="flex items-start gap-3">
//                 <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mt-1">
//                   <div className="w-3 h-3 bg-green-500 rounded-full"></div>
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">PICKUP</p>
//                   <p className="text-sm font-medium text-gray-900 leading-tight break-words">{pickup.address}</p>
//                 </div>
//               </div>

//               {/* Arrow */}
//               <div className="flex justify-center py-1">
//                 <ArrowDown className="h-4 w-4 text-gray-400 my-1 animate-bounce" />
//               </div>

//               {/* Dropoff */}
//               <div className="flex items-start gap-3">
//                 <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mt-1">
//                   <MapPin className="h-5 w-5 text-red-500" />
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">DROPOFF</p>
//                   <p className="text-sm font-medium text-gray-900 leading-tight break-words">{dropoff.address}</p>
//                 </div>
//               </div>
//             </div>

//             {/* Trip Stats */}
//             <div className="grid grid-cols-3 gap-2 mb-6">
//               <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-100">
//                 <Clock className="h-4 w-4 text-gray-600 mx-auto mb-1" />
//                 <p className="text-xs text-gray-500 font-medium">TIME</p>
//                 <p className="text-sm font-bold text-gray-900">{ride.estimatedDuration}</p>
//               </div>
//               <div className="bg-green-50 p-3 rounded-lg text-center border border-green-100">
//                 <IndianRupee className="h-4 w-4 text-green-600 mx-auto mb-1" />
//                 <p className="text-xs text-gray-500 font-medium">FARE</p>
//                 <p className="text-lg font-bold text-green-600">₹{ride.fareAmount}</p>
//               </div>
//               <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-100">
//                 <Car className="h-4 w-4 text-blue-600 mx-auto mb-1" />
//                 <p className="text-xs text-gray-500 font-medium">DISTANCE</p>
//                 <p className="text-sm font-bold text-blue-900">{ride.estimatedDistance}</p>
//               </div>
//             </div>

//             {/* Action Buttons */}
//             <div className="flex gap-3">
//               <Button onClick={onDecline} variant="outline" className="flex-1 h-12 border-2 border-red-500 text-red-600 hover:bg-red-50">
//                 Decline
//               </Button>
//               <Button onClick={onAccept} className="flex-1 h-12 bg-green-500 hover:bg-green-600 text-white font-bold">
//                 Accept Ride
//               </Button>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default RideNotification;
