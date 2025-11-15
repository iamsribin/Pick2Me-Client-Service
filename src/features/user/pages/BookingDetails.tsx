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
  Container,
} from "@chakra-ui/react";
import { format } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/shared/services/redux/store";
import { ArrowLeft } from "lucide-react";
import { Booking } from "@/shared/types/ride/ride";
import { fetchData } from "@/shared/services/api/api-service";
import DriverApiEndpoints from "@/constants/driver-api-end-pontes";
import { ResponseCom } from "@/shared/types/common";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const BookingDetail: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => ({
    user: state.user,
  }));

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        console.log("Fetching booking with ID:", bookingId);
        // const response = await driverAxios(dispatch).get(`${bookingId}`);
        const data = await fetchData<ResponseCom["data"]>(
          `${DriverApiEndpoints.GET_MY_TRIP_DETAILS}/${bookingId}`,
          "User"
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
    <Box minH="100vh" w="full" bgGradient="linear(to-br, black, gray.800)" color="white">
      <Navbar />  
      {/* Main Content */}
      <Container 
        maxW="container.xl" 
        py={{ base: 6, md: 8 }} 
        pt={{ base: 16, md: 20 }}
        mb={{ base: 8, md: 12 }}
        px={6}
      >
        <VStack spacing={6} align="stretch">
          <Button
            alignSelf="flex-start"
            leftIcon={<ArrowLeft />}
            onClick={() => navigate("/trips")}
            bg="gray.700"
            color="white"
            _hover={{ bg: "gray.600" }}
            _active={{ bg: "gray.800" }}
            border="1px"
            borderColor="gray.600"
            size={{ base: "sm", md: "md" }}
          >
            Back to Bookings
          </Button>

          {loading && (
            <Box display="flex" justifyContent="center" py={12}>
              <Spinner size="xl" color="white" />
            </Box>
          )}
          
          {error && (
            <Alert status="error" bg="red.900" borderColor="red.700" rounded="lg">
              <AlertIcon color="red.300" />
              <Text color="white">{error}</Text>
            </Alert>
          )}

          {booking && !loading && !error && (
            <Box>
              <Heading 
                size={{ base: "lg", md: "xl" }} 
                mb={8} 
                color="white" 
                textAlign="center"
              >
                Booking Details
              </Heading>
              
              <SimpleGrid 
                columns={{ base: 1, lg: 2 }} 
                spacing={8}
                bg="gray.900"
                p={8}
                rounded="xl"
                border="1px"
                borderColor="gray.700"
                shadow="xl"
              >
                <VStack align="start" spacing={6}>
                  <Box
                    bg="gray.800"
                    p={6}
                    rounded="lg"
                    border="1px"
                    borderColor="gray.700"
                    w="full"
                  >
                    <Text fontWeight="bold" fontSize="lg" mb={3} color="gray.200">
                      User Information
                    </Text>
                    <Text color="white" mb={2}>
                      <Text as="span" fontWeight="medium" color="gray.300">Name:</Text> {booking.user.userName}
                    </Text>
                    {booking.user.userNumber && (
                      <Text color="white">
                        <Text as="span" fontWeight="medium" color="gray.300">Contact:</Text> {booking.user.userNumber}
                      </Text>
                    )}
                  </Box>

                  {booking.driver && (
                    <Box
                      bg="gray.800"
                      p={6}
                      rounded="lg"
                      border="1px"
                      borderColor="gray.700"
                      w="full"
                    >
                      <Text fontWeight="bold" fontSize="lg" mb={3} color="gray.200">
                        Driver Information
                      </Text>
                      <Text color="white" mb={2}>
                        <Text as="span" fontWeight="medium" color="gray.300">Name:</Text> {booking.driver.driverName}
                      </Text>
                      <Text color="white">
                        <Text as="span" fontWeight="medium" color="gray.300">Contact:</Text> {booking.driver.driverNumber}
                      </Text>
                    </Box>
                  )}

                  <Box
                    bg="gray.800"
                    p={6}
                    rounded="lg"
                    border="1px"
                    borderColor="gray.700"
                    w="full"
                  >
                    <Text fontWeight="bold" fontSize="lg" mb={3} color="gray.200">
                      Booking Information
                    </Text>
                    <VStack align="start" spacing={2}>
                      <Text color="white">
                        <Text as="span" fontWeight="medium" color="gray.300">Status:</Text> 
                        <Box
                          as="span"
                          ml={2}
                          px={2}
                          py={1}
                          rounded="md"
                          fontSize="sm"
                          fontWeight="medium"
                          bg={
                            booking.status === "Completed" ? "green.800" :
                            booking.status === "Cancelled" ? "red.800" :
                            booking.status === "Pending" ? "yellow.800" :
                            booking.status === "Accepted" ? "blue.800" :
                            booking.status === "Confirmed" ? "purple.800" :
                            "gray.800"
                          }
                        >
                          {booking.status}
                        </Box>
                      </Text>
                      <Text color="white">
                        <Text as="span" fontWeight="medium" color="gray.300">Price:</Text> ₹ {booking.price?.toFixed(2) || "N/A"}
                      </Text>
                      <Text color="white">
                        <Text as="span" fontWeight="medium" color="gray.300">Date:</Text> {format(new Date(booking.date), "PPp")}
                      </Text>
                      <Text color="white">
                        <Text as="span" fontWeight="medium" color="gray.300">Payment Mode:</Text> {booking.paymentMode || "N/A"}
                      </Text>
                      {booking.pin && (
                        <Text color="white">
                          <Text as="span" fontWeight="medium" color="gray.300">Pin:</Text> {booking.pin}
                        </Text>
                      )}
                      {booking.feedback && (
                        <Text color="white">
                          <Text as="span" fontWeight="medium" color="gray.300">Feedback:</Text> {booking.feedback}
                        </Text>
                      )}
                      {booking.rating && (
                        <Text color="white">
                          <Text as="span" fontWeight="medium" color="gray.300">Rating:</Text> {booking.rating}/5
                        </Text>
                      )}
                    </VStack>
                  </Box>
                </VStack>

                <VStack align="start" spacing={6}>
                  <Box
                    bg="gray.800"
                    p={6}
                    rounded="lg"
                    border="1px"
                    borderColor="gray.700"
                    w="full"
                  >
                    <Text fontWeight="bold" fontSize="lg" mb={3} color="gray.200">
                      Route Information
                    </Text>
                    <VStack align="start" spacing={2}>
                      <Text color="white">
                        <Text as="span" fontWeight="medium" color="gray.300">Pickup:</Text> {booking.pickupLocation}
                      </Text>
                      <Text color="white">
                        <Text as="span" fontWeight="medium" color="gray.300">Dropoff:</Text> {booking.dropoffLocation}
                      </Text>
                      <Text color="white">
                        <Text as="span" fontWeight="medium" color="gray.300">Distance:</Text> {booking.distance || "N/A"}
                      </Text>
                      <Text color="white">
                        <Text as="span" fontWeight="medium" color="gray.300">Duration:</Text> {booking.duration || "N/A"}
                      </Text>
                      <Text color="white">
                        <Text as="span" fontWeight="medium" color="gray.300">Vehicle:</Text> {booking.vehicleModel}
                      </Text>
                    </VStack>
                  </Box>

                  <Box
                    bg="gray.800"
                    p={6}
                    rounded="lg"
                    border="1px"
                    borderColor="gray.700"
                    w="full"
                  >
                    <Text fontWeight="bold" fontSize="lg" mb={4} color="gray.200">
                      Map Snapshot
                    </Text>
                    {mapError ? (
                      <Alert status="error" borderRadius="md" bg="red.900" borderColor="red.700">
                        <AlertIcon color="red.300" />
                        <Text color="white">{mapError}</Text>
                      </Alert>
                    ) : (
                      <Image
                        src={getMapUrl()}
                        alt="Route Map"
                        borderRadius="md"
                        boxShadow="md"
                        maxW="100%"
                        w="full"
                        h="300px"
                        objectFit="cover"
                        border="1px"
                        borderColor="gray.600"
                        onError={() => setMapError("Failed to load map image")}
                      />
                    )}
                  </Box>
                </VStack>
              </SimpleGrid>
            </Box>
          )}
        </VStack>
      </Container>
      
      <Footer />
    </Box>
  );
};

export default BookingDetail;