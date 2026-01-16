import { useCallback, useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Calendar,
  Clock,
  Navigation2,
  CircleDollarSign,
} from "lucide-react";
import DriverNavbar from "../components/DriverNavbar";
import { fetchData } from "@/shared/services/api/api-service";
import { toast } from "@/shared/hooks/use-toast";
import { handleCustomError } from "@/shared/utils/error";
import DriverApiEndpoints from "@/constants/driver-api-end-pontes";

interface DailyStats {
  date: string;
  onlineMinutes: number;
  completedRides: number;
  cancelledRides: number;
  earnings: number;
}

interface AggregatedStats {
  totalEarnings: number;
  totalRides: number;
  totalCancelledRides: number;
  totalOnlineHours: number;
  avgDailyEarnings: number;
  avgDailyRides: number;
}

type FilterType = "day" | "month" | "year";

const DriverActivity = () => {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("month");
  const [chartData, setChartData] = useState<DailyStats[]>([]);
  const [aggregatedStats, setAggregatedStats] = useState<AggregatedStats>({
    totalEarnings: 0,
    totalRides: 0,
    totalCancelledRides: 0,
    totalOnlineHours: 0,
    avgDailyEarnings: 0,
    avgDailyRides: 0,
  });

  useEffect(() => {
    fetchActivityData(filter);

    return () => {
      const ctrl = (fetchActivityData as any).currentController as
        | AbortController
        | undefined;
      if (ctrl) ctrl.abort();
    };
  }, [filter]);

  const fetchActivityData = useCallback(async (filterType: FilterType) => {
    const controller = new AbortController();

    (fetchActivityData as any).currentController = controller;

    try {
      setLoading(true);

      const url = `${DriverApiEndpoints.ACTIVITY}?filter=${filterType}`;

      const resp = await fetchData<{ data: DailyStats[] }>(
        url,
        controller.signal
      );

      if (!resp || !resp.data) {
        setChartData([]);
        return;
      }

      const transformedData = resp.data.data.map((stat) => ({
        date: formatDate(stat.date, filterType),
        onlineMinutes: stat.onlineMinutes,
        completedRides: stat.completedRides,
        cancelledRides: stat.cancelledRides,
        earnings: stat.earnings,
      }));

      setChartData(transformedData);

      const totalEarnings = transformedData.reduce(
        (sum, item) => sum + item.earnings,
        0
      );
      const totalRides = transformedData.reduce(
        (sum, item) => sum + item.completedRides,
        0
      );
      const totalCancelledRides = transformedData.reduce(
        (sum, item) => sum + item.cancelledRides,
        0
      );
      const totalOnlineMinutes = transformedData.reduce(
        (sum, item) => sum + item.onlineMinutes,
        0
      );
      const daysCount = transformedData.length || 1;

      setAggregatedStats({
        totalEarnings,
        totalRides,
        totalCancelledRides,
        totalOnlineHours: Math.round((totalOnlineMinutes / 60) * 10) / 10,
        avgDailyEarnings: Math.round(totalEarnings / daysCount),
        avgDailyRides: Math.round((totalRides / daysCount) * 10) / 10,
      });
    } catch (error: any) {
      if (error?.name === "CanceledError" || error?.name === "AbortError") {
        return;
      }
      console.error("Failed to fetch activity data:", error);
      handleCustomError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const formatDate = (dateStr: string, filterType: FilterType) => {
    const date = new Date(dateStr);
    if (filterType === "day") {
      return date.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      });
    } else if (filterType === "month") {
      return date.toLocaleDateString("en-IN", { month: "short" });
    } else {
      return date.toLocaleDateString("en-IN", { year: "numeric" });
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border-2 border-yellow-500 rounded-lg shadow-xl">
          <p className="font-bold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}:{" "}
              {entry.name === "Earnings" ? `₹${entry.value}` : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-200 via-amber-100 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold">
            Loading activity data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e8c58c] via-[#f5e5c8] to-[#ffffff] flex flex-col">
      {/* Sidebar */}
      <DriverNavbar />

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 md:p-8 ml-0 sm:ml-64">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-2xl rounded-2xl mb-6 border-2 border-yellow-500">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-8 w-8 text-gray-900" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 drop-shadow-sm">
                Activity Dashboard
              </h1>
            </div>
            <p className="text-sm text-gray-800 font-medium">
              Track your performance and earnings over time
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 bg-white rounded-xl border-2 border-yellow-400 p-1 inline-flex shadow-lg">
          <button
            onClick={() => setFilter("day")}
            className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${
              filter === "day"
                ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 shadow-lg"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Last 7 Days
          </button>
          <button
            onClick={() => setFilter("month")}
            className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${
              filter === "month"
                ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 shadow-lg"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Monthly
          </button>
          <button
            onClick={() => setFilter("year")}
            className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${
              filter === "year"
                ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 shadow-lg"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Yearly
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <div className="bg-gradient-to-br from-white to-amber-100 border-2 border-yellow-400 shadow-xl rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Total Earnings
                </p>
                <h3 className="text-3xl font-bold mt-2 text-yellow-600">
                  ₹{aggregatedStats.totalEarnings.toLocaleString()}
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Avg: ₹{aggregatedStats.avgDailyEarnings.toLocaleString()}/day
                </p>
              </div>
              <div className="h-14 w-14 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                <CircleDollarSign className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-amber-100 border-2 border-yellow-400 shadow-xl rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Total Rides
                </p>
                <h3 className="text-3xl font-bold mt-2 text-yellow-600">
                  {aggregatedStats.totalRides}
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Avg: {aggregatedStats.avgDailyRides} rides/day
                </p>
              </div>
              <div className="h-14 w-14 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Navigation2 className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-amber-100 border-2 border-yellow-400 shadow-xl rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Online Hours
                </p>
                <h3 className="text-3xl font-bold mt-2 text-yellow-600">
                  {aggregatedStats.totalOnlineHours}h
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Cancelled: {aggregatedStats.totalCancelledRides} rides
                </p>
              </div>
              <div className="h-14 w-14 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Clock className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Earnings Chart */}
          <div className="bg-gradient-to-br from-white to-amber-100 border-2 border-yellow-400 shadow-xl rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <CircleDollarSign className="h-5 w-5 text-yellow-600" />
              <h3 className="text-lg font-bold text-gray-900">
                Earnings Trend
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#fbbf24"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="date"
                  stroke="#000000"
                  style={{ fontSize: "12px", fontWeight: "bold" }}
                />
                <YAxis
                  stroke="#000000"
                  style={{ fontSize: "12px", fontWeight: "bold" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="earnings"
                  name="Earnings"
                  stroke="#fbbf24"
                  strokeWidth={3}
                  dot={{ fill: "#fbbf24", r: 5 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Rides Chart */}
          <div className="bg-gradient-to-br from-white to-amber-100 border-2 border-yellow-400 shadow-xl rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Navigation2 className="h-5 w-5 text-yellow-600" />
              <h3 className="text-lg font-bold text-gray-900">
                Rides Overview
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#fbbf24"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="date"
                  stroke="#000000"
                  style={{ fontSize: "12px", fontWeight: "bold" }}
                />
                <YAxis
                  stroke="#000000"
                  style={{ fontSize: "12px", fontWeight: "bold" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="completedRides"
                  name="Completed"
                  fill="#fbbf24"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="cancelledRides"
                  name="Cancelled"
                  fill="#f59e0b"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Online Hours Chart */}
        <div className="bg-gradient-to-br from-white to-amber-100 border-2 border-yellow-400 shadow-xl rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-bold text-gray-900">Online Hours</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#fbbf24"
                opacity={0.3}
              />
              <XAxis
                dataKey="date"
                stroke="#000000"
                style={{ fontSize: "12px", fontWeight: "bold" }}
              />
              <YAxis
                stroke="#000000"
                style={{ fontSize: "12px", fontWeight: "bold" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="onlineMinutes"
                name="Online Minutes"
                fill="#fbbf24"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DriverActivity;
