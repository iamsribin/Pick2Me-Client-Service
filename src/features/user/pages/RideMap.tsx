import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
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
import {
  PhoneCall,
  MessageSquare,
  Navigation,
  Car,
  Clock,
  Send,
  X,
  Image,
  Camera,
  MapPin,
} from "lucide-react";
import { Feature, LineString } from "geojson";
import {
  hideRideMap,
  updateRideStatus,
  addChatMessage,
} from "@/shared/services/redux/slices/rideSlice";
import { RootState } from "@/shared/services/redux/store";
import { useSocket } from "@/context/socket-context";
import { toast } from "sonner";
import Webcam from "react-webcam";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Booking, RideStatusData } from "@/shared/types/user/rideTypes";
import { Coordinates, Message, ResponseCom } from "@/shared/types/common";
import { postData, patchData } from "@/shared/services/api/api-service";
import ApiEndpoints from "@/constants/user-api-end-pointes";
import debounce from "lodash/debounce";
import { useNotification } from "@/shared/hooks/useNotificatiom";
import { useChat } from "@/shared/hooks/useChat";
import { Wifi, WifiOff } from "lucide-react";
const videoConstraints = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  facingMode: "environment",
};

const DEFAULT_CENTER: [number, number] = [78.9629, 20.5937]; // Center of India
const DEFAULT_ZOOM = 4;

const RideTrackingPage: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const driverMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const pickupMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const dropoffMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam | null>(null);
  const { onNotification } = useNotification();

  mapboxgl.accessToken = import.meta.env.VITE_MAP_BOX_ACCESS_TOKEN;

  const [arrivalTime, setArrivalTime] = useState<string>("Calculating...");
  const [tripDistance, setTripDistance] = useState<string>("Calculating...");
  const [mapReady, setMapReady] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<"info" | "messages">(
    "info"
  );
  const [messageInput, setMessageInput] = useState<string>("");
  const [canCancelTrip, setCanCancelTrip] = useState<boolean>(true);
  const [cancelTimeLeft, setCancelTimeLeft] = useState<number>(30);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [imageSource, setImageSource] = useState<"camera" | "file" | null>(
    null
  );
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState<boolean>(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { isOpen, rideData } = useSelector((state: RootState) => state.RideMap);

  //  dispatch(
  //     updateRideStatus({
  //       ride_id: rideData.ride_id,
  //       status: "RideStarted",
  //     })
  //   );

  const formik = useFormik<{
    selectedImage: string | File | null;
  }>({
    initialValues: {
      selectedImage: null,
    },
    onSubmit: async (values, { resetForm }) => {
      if (!socket || !isConnected || !rideData || !values.selectedImage) return;

      try {
        let file: File;
        if (typeof values.selectedImage === "string") {
          const response = await fetch(values.selectedImage);
          const blob = await response.blob();
          file = new File([blob], `capture_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
        } else {
          file = values.selectedImage;
        }

        const formData = new FormData();
        formData.append("file", file);

        const data = await postData<ResponseCom["data"]>(
          ApiEndpoints.UPLOAD_CHAT_FILE,
          "User",
          formData
        );

        if (data.fileUrl) {
          const timestamp = new Date().toISOString();
          const message: Message = {
            sender: "user",
            content: "",
            timestamp,
            type: "image",
            fileUrl: data.fileUrl,
          };

          socket.emit("sendMessage", {
            rideId: rideData.ride_id,
            sender: "user",
            message: "",
            timestamp,
            driverId: rideData.driverDetails.driverId,
            type: "image",
            fileUrl: data.fileUrl,
          });

          dispatch(addChatMessage({ ride_id: rideData.ride_id, message }));

          toast.success("Image sent successfully");
          resetForm();
          setImageSource(null);
        } else {
          toast.error("Failed to upload image");
        }
      } catch (error) {
        toast.error((error as Error).message);
      }
    },
  });

  useEffect(() => {
    if (!isOpen || !rideData || rideData.status !== "Accepted") {
      setCanCancelTrip(false);
      localStorage.removeItem("cancelTimerStart");
      return;
    }

    const CANCELLATION_WINDOW = 30 * 1000;
    const savedStartTime = localStorage.getItem("cancelTimerStart");

    let startTime: number;
    if (savedStartTime) {
      startTime = parseInt(savedStartTime, 10);
    } else {
      startTime = Date.now();
      localStorage.setItem("cancelTimerStart", startTime.toString());
    }

    const elapsedTime = Date.now() - startTime;
    if (elapsedTime >= CANCELLATION_WINDOW) {
      setCanCancelTrip(false);
      setCancelTimeLeft(0);
      localStorage.removeItem("cancelTimerStart");
      return;
    }

    setCancelTimeLeft(Math.ceil((CANCELLATION_WINDOW - elapsedTime) / 1000));
    setCanCancelTrip(true);

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = CANCELLATION_WINDOW - elapsed;

      if (remaining <= 0) {
        clearInterval(timer);
        setCanCancelTrip(false);
        setCancelTimeLeft(0);
        localStorage.removeItem("cancelTimerStart");
        return;
      }

      setCancelTimeLeft(Math.ceil(remaining / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, rideData?.status]);

  useEffect(() => {
    if (!isOpen) {
      navigate("/");
    }
  }, [isOpen, navigate]);

  useEffect(() => {
    if (!socket || !isConnected || !rideData) return;

    // const handleRideStatus = (data: RideStatusData) => {
    //   if (
    //     data.status === "cancelled" ||
    //     data.status === "Failed" ||
    //     data.status === "RideFinished"
    //   ) {
    //     dispatch(hideRideMap());
    //     localStorage.removeItem("cancelTimerStart");
    //   } else {
    //     dispatch(
    //       updateRideStatus({
    //         ride_id: data.ride_id,
    //         status: data.status,
    //         driverCoordinates: data.driverCoordinates,
    //       })
    //     );
    //     if (
    //       data.status === "DriverComingToPickup" ||
    //       data.status === "RideStarted"
    //     ) {
    //       setCanCancelTrip(false);
    //       localStorage.removeItem("cancelTimerStart");
    //     }
    //   }
    // };

    // const handleDriverStartRide = (driverLocation: Coordinates) => {
    //   dispatch(
    //     updateRideStatus({
    //       ride_id: rideData.ride_id,
    //       status: "RideStarted",
    //       driverCoordinates: driverLocation,
    //     })
    //   );
    //   setCanCancelTrip(false);
    //   localStorage.removeItem("cancelTimerStart");
    // };

    const handleReceiveMessage = (data: {
      sender: "driver" | "user";
      message: string;
      timestamp: string;
      type: "text" | "image";
      fileUrl?: string;
    }) => {
      const message: Message = {
        sender: data.sender,
        content: data.message,
        timestamp: data.timestamp,
        type: data.type,
        fileUrl: data.fileUrl,
      };
      console.log("recevice", data);

      dispatch(addChatMessage({ ride_id: rideData.ride_id, message }));
      if (activeSection !== "messages") {
        setUnreadCount((prev) => prev + 1);
      }
    };

    const debouncedLocationUpdate = debounce(
      (data: { driverId: string; coordinates: Coordinates }) => {
        const parsedCoords = parseCoords(data.coordinates);
        if (parsedCoords && driverMarkerRef.current && mapInstanceRef.current) {
          driverMarkerRef.current.setLngLat(parsedCoords);
          dispatch(
            updateRideStatus({
              ride_id: rideData.ride_id,
              status: rideData.status,
              driverCoordinates: data.coordinates,
            })
          );
          adjustMapBounds(mapInstanceRef.current!);
          fetchTripRoute(mapInstanceRef.current!);
        }
      },
      1000
    );

    const handleDriverLocationUpdate = (data: {
      driverId: string;
      coordinates: Coordinates;
    }) => {
      console.log("handleDriverLocationUpdate", data);

      debouncedLocationUpdate(data);
    };

    // socket.on("rideStatus", handleRideStatus);
    // socket.on("driverStartRide", handleDriverStartRide);
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("driver:location:change", handleDriverLocationUpdate);

    return () => {
      // socket.off("rideStatus", handleRideStatus);
      // socket.off("driverStartRide", handleDriverStartRide);
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("driverLocationUpdate", handleDriverLocationUpdate);
      debouncedLocationUpdate.cancel();
    };
  }, [socket, isConnected, activeSection, dispatch, rideData]);

  useEffect(() => {
    if (rideData?.chatMessages && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [rideData?.chatMessages]);

  const parseCoords = useCallback(
    (
      coords: Coordinates | undefined,
      type: string = "unknown"
    ): [number, number] | null => {
      if (!coords) {
        console.warn(`No coordinates provided for ${type}`);
        toast.error(`No coordinates available for ${type}`);
        return null;
      }
      console.log(`Parsing ${type} coords:`, coords);
      const lat =
        typeof coords.latitude === "string"
          ? parseFloat(coords.latitude)
          : coords.latitude;
      const lng =
        typeof coords.longitude === "string"
          ? parseFloat(coords.longitude)
          : coords.longitude;
      if (
        isNaN(lat) ||
        isNaN(lng) ||
        Math.abs(lat) > 90 ||
        Math.abs(lng) > 180
      ) {
        console.warn(`Invalid ${type} coordinates:`, { lat, lng });
        toast.error(`Invalid coordinates for ${type}. Please check data.`);
        return null;
      }
      return [lng, lat];
    },
    []
  );

  const createVehicleIcon = useCallback((): HTMLElement => {
    const el = document.createElement("div");
    el.className = "vehicle-marker";
    el.innerHTML = `
      <div style="
        width: 32px;
        height: 32px;
        background: #10b981;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v1c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
        </svg>
      </div>
    `;
    return el;
  }, []);

  useEffect(() => {
    if (
      !isOpen ||
      !rideData ||
      !mapContainerRef.current ||
      mapInstanceRef.current
    )
      return;

    if (!mapboxgl.accessToken) {
      toast.error(
        "Mapbox access token is missing or invalid. Please check your environment variables or generate a new token from mapbox.com."
      );
      return;
    }

    if (!rideData.booking) {
      toast.error("Ride data is incomplete.");
      return;
    }

    const driverCoords = parseCoords(rideData.driverCoordinates, "driver");
    const initialCenter = driverCoords || DEFAULT_CENTER;
    const initialZoom = driverCoords ? 12 : DEFAULT_ZOOM;

    if (!driverCoords) {
      toast.warning("Invalid driver coordinates. Using default India view.");
    }

    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: initialCenter,
        zoom: initialZoom,
        attributionControl: false,
        interactive: true,
      });

      mapInstanceRef.current = map;

      map.on("load", () => {
        setMapReady(true);
        map.addControl(new mapboxgl.NavigationControl());
        if (driverCoords) {
          driverMarkerRef.current = new mapboxgl.Marker({
            element: createVehicleIcon(),
            anchor: "center",
          })
            .setLngLat(driverCoords)
            .addTo(map);
        }

        updateMarkers(map, rideData);
        adjustMapBounds(map);
        fetchTripRoute(map);
      });

      map.on("error", (e) => {
        console.error("Mapbox error:", e);
        toast.error(
          "Failed to load map. This may be due to an invalid access token or network issues. Verify your token at mapbox.com."
        );
        setArrivalTime("N/A");
        setTripDistance("N/A");
      });
    } catch (error) {
      console.error("Error initializing map:", error);
      toast.error(
        "Error initializing map. Please ensure your Mapbox token is valid and has the necessary scopes."
      );
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setMapReady(false);
      }
    };
  }, [isOpen, rideData, parseCoords, createVehicleIcon]);

  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady || !rideData || !rideData.booking)
      return;

    const driverCoords = parseCoords(rideData.driverCoordinates, "driver");
    if (driverCoords && driverMarkerRef.current) {
      driverMarkerRef.current.setLngLat(driverCoords);
    } else if (!driverCoords && driverMarkerRef.current) {
      driverMarkerRef.current.remove();
      driverMarkerRef.current = null;
    }

    updateMarkers(mapInstanceRef.current, rideData);
    adjustMapBounds(mapInstanceRef.current);
    fetchTripRoute(mapInstanceRef.current);
  }, [rideData?.driverCoordinates, rideData?.status, mapReady, parseCoords]);

  const updateMarkers = useCallback(
    (map: mapboxgl.Map, data: RideStatusData) => {
      if (data.status === "RideStarted" || data.status === "RideFinished") {
        if (pickupMarkerRef.current) {
          pickupMarkerRef.current.remove();
          pickupMarkerRef.current = null;
        }
      } else if (
        (data.status === "Accepted" ||
          data.status === "DriverComingToPickup") &&
        !pickupMarkerRef.current
      ) {
        const pickupCoords = parseCoords(
          data.booking.pickupCoordinates,
          "pickup"
        );
        if (pickupCoords) {
          pickupMarkerRef.current = new mapboxgl.Marker({
            color: "#ef4444",
            scale: 0.8,
          })
            .setLngLat(pickupCoords)
            .addTo(map);
        }
      }

      if (!dropoffMarkerRef.current) {
        const dropoffCoords = parseCoords(
          data.booking.dropoffCoordinates,
          "dropoff"
        );
        if (dropoffCoords) {
          dropoffMarkerRef.current = new mapboxgl.Marker({
            color: "#3b82f6",
            scale: 0.8,
          })
            .setLngLat(dropoffCoords)
            .addTo(map);
        }
      }
    },
    [parseCoords]
  );

  const adjustMapBounds = useCallback(
    (map: mapboxgl.Map) => {
      if (!rideData || !rideData.booking) return;

      const driverCoords = parseCoords(rideData.driverCoordinates, "driver");
      const pickupCoords = parseCoords(
        rideData.booking.pickupCoordinates,
        "pickup"
      );
      const dropoffCoords = parseCoords(
        rideData.booking.dropoffCoordinates,
        "dropoff"
      );

      const validPoints = [driverCoords, pickupCoords, dropoffCoords].filter(
        Boolean
      ) as [number, number][];

      if (validPoints.length === 0) {
        map.flyTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM });
        toast.warning("No valid coordinates available. Showing default view.");
        return;
      }

      const bounds = validPoints.reduce(
        (b, coord) => b.extend(coord),
        new mapboxgl.LngLatBounds(validPoints[0], validPoints[0])
      );

      try {
        map.fitBounds(bounds, {
          padding: { top: 100, bottom: 400, left: 40, right: 40 },
          maxZoom: 15,
          duration: 800,
        });
      } catch (error) {
        console.error("Error adjusting bounds:", error);
        toast.error("Error adjusting map view.");
      }
    },
    [rideData, parseCoords]
  );

  const getDestinationCoords = useCallback(
    (status: RideStatusData["status"], booking: Booking) => {
      if (status === "Accepted" || status === "DriverComingToPickup") {
        return parseCoords(booking.pickupCoordinates, "pickup");
      } else if (status === "RideStarted" || status === "RideFinished") {
        return parseCoords(booking.dropoffCoordinates, "dropoff");
      }
      return null;
    },
    [parseCoords]
  );

  const fetchTripRoute = useCallback(
    async (map: mapboxgl.Map) => {
      if (!rideData || !mapReady || !rideData.booking) return;

      const driverCoords = parseCoords(rideData.driverCoordinates, "driver");
      if (!driverCoords) {
        setArrivalTime(rideData.booking.duration || "N/A");
        setTripDistance(rideData.booking.distance || "N/A");
        clearRoute(map);
        return;
      }

      const destinationCoords = getDestinationCoords(
        rideData.status,
        rideData.booking
      );
      if (!destinationCoords) {
        setArrivalTime(rideData.booking.duration || "N/A");
        setTripDistance(rideData.booking.distance || "N/A");
        clearRoute(map);
        return;
      }

      console.log("Coords for route:", { driverCoords, destinationCoords });

      const routeColor =
        rideData.status === "Accepted" ||
        rideData.status === "DriverComingToPickup"
          ? "#10b981" // Green
          : "#3b82f6"; // Blue

      try {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${driverCoords[0]},${driverCoords[1]};${destinationCoords[0]},${destinationCoords[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
        console.log("Fetching route from:", url);
        const response = await fetch(url);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Directions API error:", response.status, errorText);
          throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log("Directions API response:", data);

        if (data.routes?.length > 0) {
          const route = data.routes[0];
          const durationMinutes = Math.round(route.duration / 60);
          setArrivalTime(
            durationMinutes <= 1 ? "1 min" : `${durationMinutes} mins`
          );

          const distanceKm = (route.distance / 1000).toFixed(1);
          setTripDistance(`${distanceKm} km`);

          const routeData: Feature<LineString> = {
            type: "Feature",
            properties: {},
            geometry: route.geometry,
          };

          const source = map.getSource("route") as
            | mapboxgl.GeoJSONSource
            | undefined;
          if (source) {
            source.setData(routeData);
          } else {
            map.addSource("route", { type: "geojson", data: routeData });
            map.addLayer({
              id: "route",
              type: "line",
              source: "route",
              layout: { "line-join": "round", "line-cap": "round" },
              paint: {
                "line-color": routeColor,
                "line-width": 5,
                "line-opacity": 0.85,
              },
            });
          }
        } else {
          console.warn("No routes found in API response:", data);
          toast.warning(
            "No route found between points. Using booking estimates. Verify coordinates are correct and within driving distance."
          );
          setArrivalTime(rideData.booking.duration || "N/A");
          setTripDistance(rideData.booking.distance || "N/A");
          clearRoute(map);
        }
      } catch (error) {
        console.error("Route fetch error:", error);
        toast.error(
          "Failed to fetch route. This may be due to invalid coordinates, token issues, or API limits. Falling back to booking estimates."
        );
        setArrivalTime(rideData.booking.duration || "N/A");
        setTripDistance(rideData.booking.distance || "N/A");
        // clearRoute(map);
      }
    },
    [rideData, mapReady, parseCoords, getDestinationCoords]
  );

  const clearRoute = (map: mapboxgl.Map) => {
    const source = map.getSource("route") as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [] },
      });
    }
  };

  const handleCancelTrip = async () => {
    if (rideData) {
      const data = await patchData(ApiEndpoints.CANCEL_RIDE, "User", {
        userId: rideData.userId,
        rideId: rideData.ride_id,
      });
      toast.info("Ride cancellation requested");
      onNotification("success", "your ride cancelled successfully");
      dispatch(hideRideMap());
    }

    // if (socket && isConnected && rideData) {
    //   socket.emit("cancelRide", {
    //     userId: rideData.userId,
    //     rideId: rideData.ride_id,
    //   });
    //   toast.info("Ride cancellation requested");
    //   setIsCancelDialogOpen(false);
    // }
  };

  const handleCallDriver = () => {
    if (rideData?.driverDetails.number) {
      window.open(`tel:${rideData.driverDetails.number}`);
    } else {
      toast.error("Driver phone number unavailable.");
    }
  };

  // const handleSendMessage = () => {
  //   if (!messageInput.trim() || !socket || !isConnected || !rideData) return;

  //   const timestamp = new Date().toISOString();
  //   const message: Message = {
  //     sender: "user",
  //     content: messageInput.trim(),
  //     timestamp,
  //     type: "text",
  //   };

  //   socket.emit("sendMessage", {
  //     rideId: rideData.ride_id,
  //     sender: "user",
  //     message: messageInput.trim(),
  //     timestamp,
  //     driverId: rideData.driverDetails.driverId,
  //     type: "text",
  //   });

  //   dispatch(addChatMessage({ ride_id: rideData.ride_id, message }));
  //   setMessageInput("");
  // };

  const startCamera = () => {
    setIsCameraOpen(true);
  };

  const captureImage = useCallback(() => {
    if (webcamRef.current) {
      const imageDataUrl = webcamRef.current.getScreenshot();
      if (imageDataUrl) {
        formik.setFieldValue("selectedImage", imageDataUrl);
        setImageSource("camera");
        setIsCameraOpen(false);
      } else {
        toast.error("Failed to capture image.");
      }
    }
  }, [formik]);

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    const file = event.target.files[0];
    formik.setFieldValue("selectedImage", file);
    setImageSource("file");
    event.target.value = "";
  };

  const clearImageSelection = () => {
    formik.setFieldValue("selectedImage", null);
    setImageSource(null);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const TypingIndicator: React.FC<{ isTyping: boolean; userName: string }> = ({
    isTyping,
    userName,
  }) => {
    if (!isTyping) return null;

    return (
      <div className="flex justify-start">
        <div className="bg-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm">
          <div className="flex items-center space-x-2">
            <span>{userName} is typing</span>
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ConnectionStatus: React.FC<{
    status: "connected" | "disconnected" | "connecting";
  }> = ({ status }) => {
    const getStatusConfig = () => {
      switch (status) {
        case "connected":
          return { icon: Wifi, color: "text-green-500", text: "Connected" };
        case "connecting":
          return {
            icon: Wifi,
            color: "text-yellow-500",
            text: "Connecting...",
          };
        default:
          return { icon: WifiOff, color: "text-red-500", text: "Disconnected" };
      }
    };

    const { icon: Icon, color, text } = getStatusConfig();

    return (
      <div className={`flex items-center gap-1 text-xs ${color}`}>
        <Icon className="h-3 w-3" />
        <span>{text}</span>
      </div>
    );
  };

  const MessageBubble: React.FC<{ message: Message; isOwn: boolean }> = ({
    message,
    isOwn,
  }) => {
    const formatTime = (timestamp: string) => {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[75%] p-3 rounded-xl text-sm ${
            isOwn
              ? "bg-blue-500 text-white rounded-br-sm"
              : "bg-gray-200 text-gray-800 rounded-bl-sm"
          }`}
        >
          {message.type === "text" && (
            <>
              <p className="break-words whitespace-pre-wrap">
                {message.content}
              </p>
              <p className={`text-xs mt-1 opacity-75 text-right`}>
                {formatTime(message.timestamp)}
              </p>
            </>
          )}

          {message.type === "image" && message.fileUrl && (
            <>
              <img
                src={message.fileUrl}
                alt="Chat image"
                className="max-w-[180px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(message.fileUrl, "_blank")}
                loading="lazy"
              />
              <p className={`text-xs mt-1 opacity-75 text-right`}>
                {formatTime(message.timestamp)}
              </p>
            </>
          )}
        </div>
      </div>
    );
  };

  const handleChatReceiveMessage = useCallback(
    (message: Message) => {
      if (!rideData) return;
      dispatch(addChatMessage({ ride_id: rideData.ride_id, message }));
    },
    [dispatch, rideData?.ride_id]
  );

  const handleChatUnreadCount = useCallback(
    (increment: number) => {
      if (activeSection !== "messages") {
        setUnreadCount((prev) => prev + increment);
      }
    },
    [activeSection]
  );

  // Use the custom chat hook
  const {
    sendMessage,
    handleTyping,
    isRecipientTyping,
    isConnected: chatConnected,
    connectionStatus,
  } = useChat({
    rideId: rideData?.ride_id || "n/a",
    currentUser: "user",
    recipientId: rideData?.driverDetails.driverId || "n/a",
    onReceiveMessage: handleChatReceiveMessage,
    onUnreadCountChange: handleChatUnreadCount,
    isActiveSection: activeSection === "messages",
  });

  // Update your handleSendMessage function:
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const success = sendMessage(messageInput);
    if (success) {
      setMessageInput("");
    } else {
      toast.error("Failed to send message. Please check your connection.");
    }
  };

  const getStatusBanner = useMemo(() => {
    switch (rideData?.status) {
      case "Accepted":
        return (
          <div className="bg-green-100 text-green-800 p-2 text-center text-sm">
            Driver has accepted your ride!
          </div>
        );
      case "DriverComingToPickup":
        return (
          <div className="bg-blue-100 text-blue-800 p-2 text-center text-sm">
            Driver is on the way to pickup.
          </div>
        );
      case "RideStarted":
        return (
          <div className="bg-indigo-100 text-indigo-800 p-2 text-center text-sm">
            Ride has started!
          </div>
        );
      case "RideFinished":
        return (
          <div className="bg-purple-100 text-purple-800 p-2 text-center text-sm">
            Ride completed. Rate your driver?
          </div>
        );
      default:
        return null;
    }
  }, [rideData?.status]);

  const getTripTitle = useCallback(() => {
    switch (rideData?.status) {
      case "Accepted":
      case "DriverComingToPickup":
        return `Driver to Pickup: ${arrivalTime}`;
      case "RideStarted":
        return `To Drop-off: ${arrivalTime}`;
      case "RideFinished":
        return "Ride Completed";
      default:
        return "Ride Status";
    }
  }, [rideData?.status, arrivalTime]);

  if (!rideData || !isOpen) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="text-gray-600">Loading ride data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {getStatusBanner}
      <div className="relative flex-1 min-h-0">
        <div ref={mapContainerRef} className="w-full h-full" />
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/90">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
              <p className="text-gray-600 font-medium">
                Loading map and route...
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 bg-white shadow-lg max-h-[50vh] overflow-y-auto rounded-t-xl">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3 px-4 pt-4 space-y-2">
            <CardTitle className="text-base sm:text-lg flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                {rideData.status === "RideStarted" ||
                rideData.status === "RideFinished" ? (
                  <Car className="h-4 w-4 text-blue-500 flex-shrink-0" />
                ) : (
                  <Clock className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                )}
                <span className="truncate">{getTripTitle()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 flex-shrink-0">
                <span>{tripDistance}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-emerald-500 p-1 h-8"
                  aria-label="Navigate"
                >
                  <Navigation className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveSection("info")}
                className={`flex-1 py-2 text-sm font-medium ${
                  activeSection === "info"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Trip Info
              </button>
              <button
                onClick={() => {
                  setActiveSection("messages");
                  setUnreadCount(0);
                }}
                className={`flex-1 py-2 text-sm font-medium relative ${
                  activeSection === "messages"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Messages
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-2 inline-flex items-center justify-center h-4 w-4 text-xs font-bold text-white bg-red-500 rounded-full">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </CardHeader>

          <CardContent className="px-4 pb-4 space-y-4">
            {activeSection === "info" && (
              <>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-emerald-200 flex-shrink-0">
                    <AvatarImage
                      src={rideData.driverDetails.driverPhoto}
                      alt={rideData.driverDetails.driverName}
                    />
                    <AvatarFallback className="text-sm">
                      {rideData.driverDetails.driverName?.[0] || "D"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">
                      {rideData.driverDetails.driverName}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {rideData.booking?.vehicleModel ||
                        rideData.driverDetails.vehicleModel ||
                        "N/A"}{" "}
                      • Rating: {rideData.driverDetails.rating || "0"}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="outline"
                      className="rounded-full h-8 w-8 sm:h-10 sm:w-10 relative"
                      onClick={() => {
                        setActiveSection("messages");
                        setUnreadCount(0);
                      }}
                      aria-label={`Open messages (${unreadCount} unread)`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="rounded-full h-8 w-8 sm:h-10 sm:w-10"
                      onClick={handleCallDriver}
                      aria-label="Call driver"
                    >
                      <PhoneCall className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {(rideData.status === "Accepted" ||
                  rideData.status === "DriverComingToPickup") && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-2">
                    <h3 className="font-medium text-sm">Your Ride PIN</h3>
                    <div className="text-2xl font-bold text-blue-700 tracking-widest font-mono">
                      {rideData.booking?.pin ?? "N/A"}
                    </div>
                    <p className="text-xs text-gray-600">
                      Share this with your driver to verify and start the ride.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-gray-500">Distance</p>
                    <p className="font-medium">
                      {rideData.booking?.distance || tripDistance}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500">Duration</p>
                    <p className="font-medium">
                      {rideData.booking?.duration || arrivalTime}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500">Fare</p>
                    <p className="font-medium">
                      ₹{rideData.booking?.price ?? "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500">Vehicle No.</p>
                    <p className="font-medium">
                      {rideData.driverDetails.vehicleNumber ?? "N/A"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex gap-3 items-start">
                    <div className="mt-1 flex-shrink-0">
                      <MapPin className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-medium uppercase">
                        Pickup
                      </p>
                      <p className="text-sm font-medium leading-tight truncate">
                        {rideData.booking?.pickupLocation || "Current Location"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="mt-1 flex-shrink-0">
                      <MapPin className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-medium uppercase">
                        Drop-off
                      </p>
                      <p className="text-sm font-medium leading-tight truncate">
                        {rideData.booking?.dropoffLocation || "Destination"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  {canCancelTrip && rideData.status === "Accepted" && (
                    <Dialog
                      open={isCancelDialogOpen}
                      onOpenChange={setIsCancelDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button variant="destructive" className="flex-1 h-10">
                          <X className="h-4 w-4 mr-2" />
                          Cancel ({cancelTimeLeft}s)
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Cancellation</DialogTitle>
                          <DialogDescription>
                            Cancel your ride? This can't be undone. Time left:{" "}
                            {cancelTimeLeft}s
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsCancelDialogOpen(false)}
                          >
                            Keep Ride
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleCancelTrip}
                          >
                            Cancel Ride
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                  {/* <Button
                    variant="outline"
                    className="flex-1 h-10"
                    onClick={() => toast.info("Sharing location...")} // Placeholder for share functionality
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Share Location
                  </Button> */}
                </div>
              </>
            )}

            {activeSection === "messages" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-700">
                    Chat with Driver
                  </h3>
                  <ConnectionStatus status={connectionStatus} />
                </div>
                {isCameraOpen && (
                  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="relative bg-white rounded-xl p-4 w-full max-w-md space-y-4">
                      <Button
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => setIsCameraOpen(false)}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={videoConstraints}
                        className="w-full rounded-lg"
                      />
                      <Button className="w-full" onClick={captureImage}>
                        Capture Photo
                      </Button>
                    </div>
                  </div>
                )}

                {formik.values.selectedImage && (
                  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <form
                      onSubmit={formik.handleSubmit}
                      className="relative bg-white rounded-xl p-4 w-full max-w-md space-y-4"
                    >
                      <Button
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={clearImageSelection}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                      <img
                        src={
                          typeof formik.values.selectedImage === "string"
                            ? formik.values.selectedImage
                            : URL.createObjectURL(formik.values.selectedImage)
                        }
                        alt="Preview"
                        className="w-full max-h-[60vh] object-contain rounded-lg"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={
                            imageSource === "camera"
                              ? () => {
                                  clearImageSelection();
                                  setIsCameraOpen(true);
                                }
                              : triggerFileInput
                          }
                        >
                          {imageSource === "camera"
                            ? "Retake"
                            : "Choose Another"}
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1"
                          disabled={formik.isSubmitting}
                        >
                          Send Image
                        </Button>
                      </div>
                    </form>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                  </div>
                )}

                <div className="h-[30vh] overflow-y-auto bg-gray-50 rounded-lg p-3 space-y-3 border border-gray-200 scroll-smooth">
                  {rideData.chatMessages?.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-8">
                      <p>Start chatting with your driver!</p>
                      <p className="text-xs mt-1">
                        Ask questions about pickup or share updates.
                      </p>
                    </div>
                  ) : (
                    rideData.chatMessages?.map((message, index) => (
                      <MessageBubble
                        key={`${message.timestamp}-${index}`}
                        message={message}
                        isOwn={message.sender === "user"}
                      />
                    ))
                  )}

                  {/* Typing Indicator */}
                  <TypingIndicator
                    isTyping={isRecipientTyping}
                    userName="Driver"
                  />

                  <div ref={chatEndRef} />
                </div>

                {/* Input Section */}
                <div className="flex items-center gap-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value);
                      if (e.target.value.trim()) {
                        handleTyping();
                      }
                    }}
                    placeholder="Type your message..."
                    className="flex-1 h-10"
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        messageInput.trim()
                      ) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={!chatConnected}
                    maxLength={500}
                    aria-label="Chat input"
                  />
                  <Button
                    onClick={handleSendMessage}
                    className="h-10 px-3 disabled:opacity-50"
                    disabled={!messageInput.trim() || !chatConnected}
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={startCamera}
                    className="h-10 px-3"
                    variant="outline"
                    disabled={!chatConnected}
                    aria-label="Open camera"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={triggerFileInput}
                    className="h-10 px-3"
                    variant="outline"
                    disabled={!chatConnected}
                    aria-label="Upload image"
                  >
                    <Image className="h-4 w-4" />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                  </Button>
                </div>

                {/* Character count */}
                {messageInput.length > 400 && (
                  <p className="text-xs text-gray-500 text-right">
                    {messageInput.length}/500
                  </p>
                )}
              </div>
            )}

            {/* </div>
            )} */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RideTrackingPage;
