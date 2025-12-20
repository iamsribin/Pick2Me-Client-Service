// import React, { useCallback, useRef, useState } from "react";
// import { useFormik } from "formik";
// import Webcam from "react-webcam";
// import { Button } from "@/shared/components/ui/button";
// import { Camera, X, Image } from "lucide-react";
// import { toast } from "sonner";
// import { useDispatch } from "react-redux";
// import { addChatMessage } from "@/shared/services/redux/slices/driverRideSlice";
// import { useSocket } from "@/context/socket-context";
// import { Message, ResponseCom } from "@/shared/types/common";
// import { postData } from "@/shared/services/api/api-service";
// import DriverApiEndpoints from "@/constants/driver-api-end-pontes";

// const videoConstraints = {
//   width: { ideal: 1280 },
//   height: { ideal: 720 },
//   facingMode: "environment",
// };

// interface ImageCaptureProps {
//   rideData: ResponseCom["data"];
// }

// const ImageCapture: React.FC<ImageCaptureProps> = ({ rideData }) => {
//   const dispatch = useDispatch();
//   const { socket, isConnected } = useSocket();
//   const webcamRef = useRef<Webcam | null>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
//   const [imageSource, setImageSource] = useState<"camera" | "file" | null>(
//     null
//   );

//   const formik = useFormik<{
//     selectedImage: string | File | null;
//   }>({
//     initialValues: {
//       selectedImage: null,
//     },
//     onSubmit: async (values, { resetForm }) => {
//       if (!socket || !isConnected || !rideData || !values.selectedImage) return;

//       try {
//         let file: File;
//         if (typeof values.selectedImage === "string") {
//           const response = await fetch(values.selectedImage);
//           const blob = await response.blob();
//           file = new File([blob], `capture_${Date.now()}.jpg`, {
//             type: "image/jpeg",
//           });
//         } else {
//           file = values.selectedImage;
//         }

//         const formData = new FormData();
//         formData.append("file", file);

//         const data = await postData<ResponseCom["data"]>(
//           DriverApiEndpoints.UPLOAD_CHAT_FILE,
//           "Driver",
//           formData
//         );

//         if (data.fileUrl) {
//           const timestamp = new Date().toISOString();
//           const message: Message = {
//             sender: "driver",
//             content: "",
//             timestamp,
//             type: "image",
//             fileUrl: data.fileUrl,
//           };

//           socket.emit("sendMessage", {
//             rideId: rideData.bookingDetails.rideId,
//             sender: "driver",
//             message: "",
//             timestamp,
//             userId: rideData.customer.userId,
//             type: "image",
//             fileUrl: data.fileUrl,
//           });

//           dispatch(
//             addChatMessage({
//               bookingId: rideData.bookingId,
//               message,
//             })
//           );

//           toast.success("Image sent successfully");
//           resetForm();
//           setImageSource(null);
//         } else {
//           toast.error("Failed to upload image");
//         }
//       } catch (error) {
//         toast.error((error as Error).message);
//       }
//     },
//   });

//   const startCamera = () => {
//     setIsCameraOpen(true);
//     toast.info("Camera opened successfully");
//   };

//   const stopCamera = () => {
//     setIsCameraOpen(false);
//   };

//   const captureImage = useCallback(() => {
//     if (webcamRef.current) {
//       const imageDataUrl = webcamRef.current.getScreenshot();
//       if (imageDataUrl) {
//         formik.setFieldValue("selectedImage", imageDataUrl);
//         setImageSource("camera");
//         setIsCameraOpen(false);
//       } else {
//         toast.error("Failed to capture image. Please try again.");
//       }
//     }
//   }, [formik]);

//   const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
//     if (!event.target.files || event.target.files.length === 0) return;

//     const file = event.target.files[0];
//     formik.setFieldValue("selectedImage", file);
//     setImageSource("file");
//     event.target.value = "";
//   };

//   const clearImageSelection = () => {
//     if (
//       typeof formik.values.selectedImage !== "string" &&
//       formik.values.selectedImage
//     ) {
//       URL.revokeObjectURL(URL.createObjectURL(formik.values.selectedImage));
//     }
//     formik.setFieldValue("selectedImage", null);
//     setImageSource(null);
//   };

//   const triggerFileInput = () => {
//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//       fileInputRef.current.click();
//     }
//   };

//   return (
//     <div>
//       {isCameraOpen && (
//         <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
//           <div className="relative bg-white rounded-lg p-6 w-full max-w-sm">
//             <Button
//               onClick={stopCamera}
//               className="absolute top-2 right-2 bg-red-500 hover:bg-red-600"
//               size="icon"
//             >
//               <X className="h-4 w-4" />
//             </Button>
//             <Webcam
//               audio={false}
//               ref={webcamRef}
//               screenshotFormat="image/jpeg"
//               videoConstraints={videoConstraints}
//               className="w-full rounded-lg"
//               onUserMediaError={(error) => {
//                 console.error("Webcam error:", error);
//                 toast.error(
//                   "Failed to access camera. Please check permissions and try again."
//                 );
//                 stopCamera();
//               }}
//             />
//             <div className="flex justify-center gap-2 mt-3">
//               <Button
//                 onClick={captureImage}
//                 className="bg-blue-600 hover:bg-blue-700"
//               >
//                 Capture
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}
//       {formik.values.selectedImage && (
//         <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
//           <form onSubmit={formik.handleSubmit}>
//             <div className="relative bg-white rounded-lg p-6 w-full max-w-sm">
//               <Button
//                 onClick={clearImageSelection}
//                 className="absolute top-2 right-2 bg-red-500 hover:bg-red-600"
//                 size="icon"
//               >
//                 <X className="h-4 w-4" />
//               </Button>
//               <img
//                 src={
//                   typeof formik.values.selectedImage === "string"
//                     ? formik.values.selectedImage
//                     : URL.createObjectURL(formik.values.selectedImage)
//                 }
//                 alt="Preview"
//                 className="w-full rounded-lg max-h-[50vh] object-contain"
//               />
//               <div className="flex justify-center gap-2 mt-3">
//                 {imageSource === "camera" && (
//                   <Button
//                     type="button"
//                     onClick={() => {
//                       clearImageSelection();
//                       startCamera();
//                     }}
//                     className="bg-gray-600 hover:bg-gray-700"
//                   >
//                     Retake
//                   </Button>
//                 )}
//                 {imageSource === "file" && (
//                   <Button
//                     type="button"
//                     onClick={triggerFileInput}
//                     className="bg-gray-600 hover:bg-gray-700"
//                   >
//                     Choose Another
//                   </Button>
//                 )}
//                 <Button
//                   type="submit"
//                   className="bg-blue-600 hover:bg-blue-700"
//                   disabled={formik.isSubmitting}
//                 >
//                   Send
//                 </Button>
//               </div>
//             </div>
//           </form>
//           <input
//             ref={fileInputRef}
//             id="file-input"
//             type="file"
//             accept="image/*"
//             className="hidden"
//             onChange={handleFileInput}
//           />
//         </div>
//       )}
//       <div className="flex gap-2">
//         <Button
//           onClick={startCamera}
//           className="h-10 w-10 bg-blue-600 hover:bg-blue-700 p-0"
//           disabled={!!formik.values.selectedImage || isCameraOpen}
//         >
//           <Camera className="h-4 w-4" />
//         </Button>
//         <div className="relative">
//           <Button
//             asChild
//             variant="ghost"
//             className="h-10 w-10 p-0"
//             disabled={!!formik.values.selectedImage || isCameraOpen}
//           >
//             <label htmlFor="file-input">
//               <Image className="h-4 w-4" />
//               <span className="sr-only">Choose image</span>
//             </label>
//           </Button>
//           <input
//             ref={fileInputRef}
//             id="file-input"
//             type="file"
//             accept="image/*"
//             className="hidden"
//             onChange={handleFileInput}
//             disabled={!!formik.values.selectedImage || isCameraOpen}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ImageCapture;
