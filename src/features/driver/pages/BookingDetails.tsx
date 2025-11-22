import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  VStack,
  Text,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  Heading,
  Image,
  SimpleGrid,
} from "@chakra-ui/react";
import { format } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/shared/services/redux/store";
import { ArrowLeft } from "lucide-react";
import { Booking } from "@/shared/types/ride/ride";
import { fetchData } from "@/shared/services/api/api-service";
import DriverApiEndpoints from "@/constants/driver-api-end-pontes";
import { ResponseCom } from "@/shared/types/common";

const BookingDetail: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const { driver } = useSelector((state: RootState) => ({
    driver: state.driver,
  }));

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        console.log("Fetching booking with ID:", bookingId);
        // const response = await driverAxios(dispatch).get(`${bookingId}`);
        const data = await fetchData<ResponseCom["data"]>(
          `${DriverApiEndpoints.GET_MY_TRIP_DETAILS}/${bookingId}`,
          "Driver"
        );
        setBooking(data);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching booking:", err);
        setError(
          "Failed to fetch booking details: " + (err.message || "Unknown error")
        );
      } finally {
        setLoading(false);
      }
    };
    if (bookingId) {
      fetchBooking();
    } else {
      setError("Invalid booking ID");
      setLoading(false);
    }
  }, [bookingId, dispatch]);

  const getMapUrl = () => {
    if (!booking) {
      setMapError("No booking data available");
      return "";
    }

    const { pickupCoordinates, dropoffCoordinates } = booking;

    // Validate coordinates
    if (
      !pickupCoordinates?.latitude ||
      !pickupCoordinates?.longitude ||
      !dropoffCoordinates?.latitude ||
      !dropoffCoordinates?.longitude ||
      isNaN(pickupCoordinates.latitude) ||
      isNaN(pickupCoordinates.longitude) ||
      isNaN(dropoffCoordinates.latitude) ||
      isNaN(dropoffCoordinates.longitude)
    ) {
      setMapError("Invalid or missing coordinates");
      return "";
    }

    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    if (!apiKey) {
      setMapError("Google Maps API key is missing");
      return "";
    }

    const path = `path=${pickupCoordinates.latitude},${pickupCoordinates.longitude}|${dropoffCoordinates.latitude},${dropoffCoordinates.longitude}`;
    const url = `https://maps.googleapis.com/maps/api/staticmap?size=400x300&${path}&markers=color:red|${pickupCoordinates.latitude},${pickupCoordinates.longitude}&markers=color:blue|${dropoffCoordinates.latitude},${dropoffCoordinates.longitude}&key=${apiKey}`;

    console.log("Generated Map URL:", url);
    return url;
  };

  return (
    <Box p={6} maxW="container.lg" mx="auto">
      <Button
        mb={4}
        leftIcon={<ArrowLeft />}
        onClick={() => navigate("/driver/trips")}
        colorScheme="blue"
        variant="outline"
      >
        Back to Bookings
      </Button>

      {loading && <Spinner size="xl" />}
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {booking && !loading && !error && (
        <>
          <Heading size="lg" mb={6}>
            Booking Details
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <VStack align="start" spacing={4}>
              <Box>
                <Text fontWeight="bold" fontSize="lg">
                  User Information
                </Text>
                <Text>Name: {booking.user.userName}</Text>
                {/* <Text>ID: {booking.user.user_id}</Text> */}
                {booking.user.userNumber && (
                  <Text>Contact: {booking.user.userNumber}</Text>
                )}
              </Box>

              {booking.driver && (
                <Box>
                  <Text fontWeight="bold" fontSize="lg">
                    Driver Information
                  </Text>
                  <Text>Name: {booking.driver.driverName}</Text>
                  {/* <Text>ID: {booking.driver.driver_id}</Text> */}
                  <Text>Contact: {booking.driver.driverNumber}</Text>
                </Box>
              )}

              <Box>
                <Text fontWeight="bold" fontSize="lg">
                  Booking Information
                </Text>
                <Text>Status: {booking.status}</Text>
                <Text>Price: ₹ {booking.price?.toFixed(2) || "N/A"}</Text>
                <Text>Date: {format(new Date(booking.date), "PPp")}</Text>
                <Text>Payment Mode: {booking.paymentMode || "N/A"}</Text>
                {booking.pin && <Text>Pin: {booking.pin}</Text>}
                {booking.feedback && <Text>Feedback: {booking.feedback}</Text>}
                {booking.rating && <Text>Rating: {booking.rating}/5</Text>}
              </Box>
            </VStack>

            <VStack align="start" spacing={4}>
              <Box>
                <Text fontWeight="bold" fontSize="lg">
                  Route Information
                </Text>
                <Text>Pickup: {booking.pickupLocation}</Text>
                <Text>Dropoff: {booking.dropoffLocation}</Text>
                <Text>Distance: {booking.distance || "N/A"}</Text>
                <Text>Duration: {booking.duration || "N/A"}</Text>
                <Text>Vehicle: {booking.vehicleModel}</Text>
              </Box>

              <Box>
                <Text fontWeight="bold" fontSize="lg">
                  Map Snapshot
                </Text>
                {mapError ? (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    {mapError}
                  </Alert>
                ) : (
                  <Image
                    src={getMapUrl()}
                    alt="Route Map"
                    borderRadius="md"
                    boxShadow="md"
                    maxW="100%"
                    onError={() => setMapError("Failed to load map image")}
                  />
                )}
              </Box>
            </VStack>
          </SimpleGrid>
        </>
      )}
    </Box>
  );
};

export default BookingDetail;
