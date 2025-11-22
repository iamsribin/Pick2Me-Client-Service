import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Select,
  Input,
  Flex,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  HStack,
} from "@chakra-ui/react";
import { format, subDays } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/shared/services/redux/store";
import Navbar from "../components/layout/Navbar";
import { Calendar } from "lucide-react";
import { BookingListType } from "./type";
import { fetchData } from "@/shared/services/api/api-service";
import DriverApiEndpoints from "@/constants/driver-api-end-pontes";
import { ResponseCom } from "@/shared/types/common";

const BookingList: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingListType[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingListType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [startDate, setStartDate] = useState<string>(
    format(subDays(new Date(), 30), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 10;

  const dispatch = useDispatch<AppDispatch>();
  const { driver } = useSelector((state: RootState) => ({
    driver: state.driver,
  }));

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data = await fetchData<ResponseCom["data"]>(
          `${DriverApiEndpoints.GET_MY_TRIPS}/user`,
          "User"
        );
        
        setBookings(data);
        setFilteredBookings(data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch bookings");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [dispatch, driver.driverId]);

  useEffect(() => {
    let filtered = bookings;

    if (statusFilter !== "All") {
      filtered = filtered.filter((booking) => booking.status === statusFilter);
    }

    if (startDate && endDate) {
      filtered = filtered.filter((booking) => {
        const bookingDate = new Date(booking.date);
        return (
          bookingDate >= new Date(startDate) && bookingDate <= new Date(endDate)
        );
      });
    }

    setFilteredBookings(filtered);
    setCurrentPage(1);
  }, [statusFilter, startDate, endDate, bookings]);

  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = filteredBookings.slice(
    indexOfFirstBooking,
    indexOfLastBooking
  );
  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleView = (bookingId: string) => {
    navigate(`/getMyTripDetails/${bookingId}`);
  };

  return (
    <Box minH="100vh" w="full" bgGradient="linear(to-br, black, gray.800)" color="white">
      <Navbar />
      <Box
        flex="1"
        p={{ base: 4, sm: 6 }}
        w="full"
        maxW="100%"
        mx="auto"
        pt={{ base: 16, md: 20 }}
        className="container mx-auto px-6"
      >
        <Text
          fontSize={{ base: "xl", sm: "2xl" }}
          mb={6}
          fontWeight="bold"
          display="flex"
          alignItems="center"
          color="white"
        >
          <Calendar className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Booking List
        </Text>

        <Flex
          mb={6}
          wrap="wrap"
          gap={4}
          direction={{ base: "column", sm: "row" }}
        >
          <Box
            flex={{ base: "1", sm: "1" }}
            minW={{ base: "full", sm: "200px" }}
          >
            <Text mb={2} fontSize={{ base: "sm", sm: "md" }} color="gray.300">
              Filter by Status
            </Text>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              size={{ base: "sm", sm: "md" }}
              bg="gray.900"
              borderColor="gray.700"
              color="white"
              _hover={{ borderColor: "gray.600" }}
              _focus={{ borderColor: "gray.500", boxShadow: "none" }}
            >
              <option value="All" style={{ backgroundColor: '#1a202c', color: 'white' }}>All</option>
              <option value="Completed" style={{ backgroundColor: '#1a202c', color: 'white' }}>Completed</option>
              <option value="Cancelled" style={{ backgroundColor: '#1a202c', color: 'white' }}>Cancelled</option>
              <option value="Pending" style={{ backgroundColor: '#1a202c', color: 'white' }}>Pending</option>
              <option value="Accepted" style={{ backgroundColor: '#1a202c', color: 'white' }}>Accepted</option>
              <option value="Confirmed" style={{ backgroundColor: '#1a202c', color: 'white' }}>Confirmed</option>
            </Select>
          </Box>
          <Box
            flex={{ base: "1", sm: "1" }}
            minW={{ base: "full", sm: "200px" }}
          >
            <Text mb={2} fontSize={{ base: "sm", sm: "md" }} color="gray.300">
              Start Date
            </Text>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              size={{ base: "sm", sm: "md" }}
              bg="gray.900"
              borderColor="gray.700"
              color="white"
              _hover={{ borderColor: "gray.600" }}
              _focus={{ borderColor: "gray.500", boxShadow: "none" }}
            />
          </Box>
          <Box
            flex={{ base: "1", sm: "1" }}
            minW={{ base: "full", sm: "200px" }}
          >
            <Text mb={2} fontSize={{ base: "sm", sm: "md" }} color="gray.300">
              End Date
            </Text>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              size={{ base: "sm", sm: "md" }}
              bg="gray.900"
              borderColor="gray.700"
              color="white"
              _hover={{ borderColor: "gray.600" }}
              _focus={{ borderColor: "gray.500", boxShadow: "none" }}
            />
          </Box>
        </Flex>

        {loading && (
          <Box display="flex" justifyContent="center" py={8}>
            <Spinner size="xl" color="white" />
          </Box>
        )}
        
        {error && (
          <Alert status="error" mb={6} bg="red.900" borderColor="red.700">
            <AlertIcon color="red.300" />
            <Text color="white">{error}</Text>
          </Alert>
        )}

        {!loading && !error && (
          <>
            <Box 
              overflowX="auto" 
              bg="gray.900" 
              rounded="lg" 
              border="1px" 
              borderColor="gray.700"
              shadow="xl"
            >
              <Table variant="simple" size={{ base: "sm", sm: "md" }}>
                <Thead bg="gray.800">
                  <Tr>
                    <Th color="gray.300" borderColor="gray.700">Pickup</Th>
                    <Th color="gray.300" borderColor="gray.700">Dropoff</Th>
                    <Th color="gray.300" borderColor="gray.700">Distance</Th>
                    <Th color="gray.300" borderColor="gray.700">Price</Th>
                    <Th color="gray.300" borderColor="gray.700">Date</Th>
                    <Th color="gray.300" borderColor="gray.700">Status</Th>
                    <Th color="gray.300" borderColor="gray.700">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {currentBookings.map((booking, index) => (
                    <Tr 
                      key={booking._id} 
                      bg={index % 2 === 0 ? "gray.900" : "gray.800"}
                      _hover={{ bg: "gray.700" }}
                      transition="background-color 0.2s"
                    >
                      <Td color="white" borderColor="gray.700">{booking.pickupLocation}</Td>
                      <Td color="white" borderColor="gray.700">{booking.dropoffLocation}</Td>
                      <Td color="white" borderColor="gray.700">{booking.distance || "N/A"}</Td>
                      <Td color="white" borderColor="gray.700">${booking.price?.toFixed(2) || "N/A"}</Td>
                      <Td color="white" borderColor="gray.700">{format(new Date(booking.date), "PPp")}</Td>
                      <Td borderColor="gray.700">
                        <Box
                          as="span"
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
                          color="white"
                        >
                          {booking.status}
                        </Box>
                      </Td>
                      <Td borderColor="gray.700">
                        <Button
                          size={{ base: "xs", sm: "sm" }}
                          bg="gray.700"
                          color="white"
                          _hover={{ bg: "gray.600" }}
                          _active={{ bg: "gray.800" }}
                          onClick={() => handleView(booking._id)}
                          transition="background-color 0.2s"
                        >
                          View
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>

            {filteredBookings.length === 0 && (
              <Box textAlign="center" py={8}>
                <Text color="gray.400" fontSize="lg">No bookings found</Text>
              </Box>
            )}

            {totalPages > 1 && (
              <HStack mt={6} justify="center" spacing={2} wrap="wrap">
                <Button
                  size={{ base: "sm", sm: "md" }}
                  onClick={() => handlePageChange(currentPage - 1)}
                  isDisabled={currentPage === 1}
                  bg="gray.700"
                  color="white"
                  _hover={{ bg: "gray.600" }}
                  _disabled={{ bg: "gray.800", color: "gray.500" }}
                  transition="background-color 0.2s"
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      size={{ base: "sm", sm: "md" }}
                      onClick={() => handlePageChange(page)}
                      bg={currentPage === page ? "gray.600" : "gray.800"}
                      color="white"
                      _hover={{ bg: currentPage === page ? "gray.500" : "gray.700" }}
                      border={currentPage === page ? "1px" : "none"}
                      borderColor={currentPage === page ? "gray.400" : "transparent"}
                      transition="all 0.2s"
                    >
                      {page}
                    </Button>
                  )
                )}
                <Button
                  size={{ base: "sm", sm: "md" }}
                  onClick={() => handlePageChange(currentPage + 1)}
                  isDisabled={currentPage === totalPages}
                  bg="gray.700"
                  color="white"
                  _hover={{ bg: "gray.600" }}
                  _disabled={{ bg: "gray.800", color: "gray.500" }}
                  transition="background-color 0.2s"
                >
                  Next
                </Button>
              </HStack>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default BookingList;