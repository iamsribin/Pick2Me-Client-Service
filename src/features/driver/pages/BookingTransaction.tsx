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
import DriverNavbar from "../components/DriverNavbar";
import { Calendar } from "lucide-react";
import { BookingListType } from "./type";
import { fetchData } from "@/shared/services/api/api-service";
import DriverApiEndpoints from "@/constants/driver-api-end-pontes";
import { ResponseCom } from "@/shared/types/common";

const BookingList: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingListType[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingListType[]>(
    []
  );
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
        // const response = await driverAxios(dispatch).get();
        const data = await fetchData<ResponseCom["data"]>(
          `${DriverApiEndpoints.GET_MY_TRIPS}/driver`,
          "Driver"
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
    console.log("bookingId", bookingId);

    navigate(`/driver/getMyTripDetails/${bookingId}`);
  };

  return (
    <Box minH="100vh" w="full">
      <Flex direction={{ base: "column", sm: "row" }} h="full" w="full">
        <Box
          w={{ base: "100%", sm: "60" }}
          flexShrink={0}
          p={0}
          className="bg-white shadow-lg"
        >
          <DriverNavbar />
        </Box>
        <Box
          flex="1"
          p={{ base: 2, sm: 4 }}
          ml={{ sm: 0 }}
          pl={{ sm: "60px" }}
          w="full"
        >
          <Text
            fontSize={{ base: "xl", sm: "2xl" }}
            mb={4}
            fontWeight="bold"
            display="flex"
            alignItems="center"
          >
            <Calendar className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Booking List
          </Text>

          <Flex
            mb={4}
            wrap="wrap"
            gap={2}
            direction={{ base: "column", sm: "row" }}
          >
            <Box
              flex={{ base: "1", sm: "1" }}
              minW={{ base: "full", sm: "200px" }}
            >
              <Text mb={1} fontSize={{ base: "sm", sm: "md" }}>
                Filter by Status
              </Text>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size={{ base: "sm", sm: "md" }}
              >
                <option value="All">All</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="Confirmed">Confirmed</option>
              </Select>
            </Box>
            <Box
              flex={{ base: "1", sm: "1" }}
              minW={{ base: "full", sm: "200px" }}
            >
              <Text mb={1} fontSize={{ base: "sm", sm: "md" }}>
                Start Date
              </Text>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                size={{ base: "sm", sm: "md" }}
              />
            </Box>
            <Box
              flex={{ base: "1", sm: "1" }}
              minW={{ base: "full", sm: "200px" }}
            >
              <Text mb={1} fontSize={{ base: "sm", sm: "md" }}>
                End Date
              </Text>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                size={{ base: "sm", sm: "md" }}
              />
            </Box>
          </Flex>

          {loading && <Spinner size="xl" />}
          {error && (
            <Alert status="error" mb={4}>
              <AlertIcon />
              {error}
            </Alert>
          )}

          {!loading && !error && (
            <>
              <Box overflowX="auto">
                <Table variant="simple" size={{ base: "sm", sm: "md" }}>
                  <Thead>
                    <Tr>
                      <Th>Pickup</Th>
                      <Th>Dropoff</Th>
                      <Th>Distance</Th>
                      <Th>Price</Th>
                      <Th>Date</Th>
                      <Th>Status</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {currentBookings.map((booking) => (
                      <Tr key={booking._id}>
                        <Td>{booking.pickupLocation}</Td>
                        <Td>{booking.dropoffLocation}</Td>
                        <Td>{booking.distance || "N/A"}</Td>
                        <Td>${booking.price?.toFixed(2) || "N/A"}</Td>
                        <Td>{format(new Date(booking.date), "PPp")}</Td>
                        <Td>{booking.status}</Td>
                        <Td>
                          <Button
                            size={{ base: "xs", sm: "sm" }}
                            colorScheme="blue"
                            onClick={() => handleView(booking._id)}
                          >
                            View
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>

              <HStack mt={4} justify="center" spacing={2}>
                <Button
                  size={{ base: "sm", sm: "md" }}
                  onClick={() => handlePageChange(currentPage - 1)}
                  isDisabled={currentPage === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      size={{ base: "sm", sm: "md" }}
                      onClick={() => handlePageChange(page)}
                      colorScheme={currentPage === page ? "blue" : "gray"}
                    >
                      {page}
                    </Button>
                  )
                )}
                <Button
                  size={{ base: "sm", sm: "md" }}
                  onClick={() => handlePageChange(currentPage + 1)}
                  isDisabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </HStack>
            </>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

export default BookingList;
