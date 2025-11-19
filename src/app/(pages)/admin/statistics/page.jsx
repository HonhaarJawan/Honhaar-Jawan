"use client";
import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiAdminFill } from "react-icons/ri";
import {
  FaUsers,
  FaDollarSign,
  FaArrowUp,
  FaArrowDown,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import AdminProtectedRoutes from "@/ProtectedRoutes/AdminProtectedRoutes";
import Link from "next/link";
import { firestore } from "@/Backend/Firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  Timestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { PiStudent } from "react-icons/pi";
import useAdmin from "@/Hooks/adminHooks";
import { HiOutlineChevronRight, HiOutlineCalendar } from "react-icons/hi";
import { FiRefreshCw } from "react-icons/fi";
import { useToast } from "@/components/primary/Toast";

const StatisticsPage = () => {
  const { adminData, loading: adminLoading } = useAdmin();
  const { showToast } = useToast();
  const [timePeriod, setTimePeriod] = useState("today");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [indexError, setIndexError] = useState(null);
  const [dataFetched, setDataFetched] = useState(false);

  // Data states
  const [adminsData, setAdminsData] = useState([]);
  const [signupsData, setSignupsData] = useState({ today: 0, yesterday: 0 });
  const [testPassedData, setTestPassedData] = useState({
    today: 0,
    yesterday: 0,
  });
  const [testAttemptedData, setTestAttemptedData] = useState({
    today: 0,
    yesterday: 0,
  });
  const [enrolledData, setEnrolledData] = useState({ today: 0, yesterday: 0 });
  const [revenueData, setRevenueData] = useState({ today: 0, yesterday: 0 });

  // Overall stats from overallstats document
  const [overallStats, setOverallStats] = useState({
    totalEnrolledStudents: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalTestsPassed: 0,
    totalTestsFailed: 0,
  });

  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    admins: false,
    signups: false,
    testPassed: false,
    testAttempted: false,
    enrolled: false,
    revenue: false,
    overall: false,
  });

  // Helper function to get Pakistan time date ranges (UTC+5)
  const getPakistanDateRange = useCallback((daysOffset = 0) => {
    const now = new Date();
    const pakistanTime = new Date(now.getTime() + 5 * 60 * 60 * 1000); // Add 5 hours for Pakistan timezone

    const targetDate = new Date(pakistanTime);
    targetDate.setDate(targetDate.getDate() + daysOffset);

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return {
      start: Timestamp.fromDate(startOfDay),
      end: Timestamp.fromDate(endOfDay),
      startDate: startOfDay,
      endDate: endOfDay,
    };
  }, []);

  // Format time to 12-hour format with AM/PM
  const formatTime = useCallback((date) => {
    if (!date) return "Never";
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }, []);

  // Check if a user has paid for enrollment (status "5")
  const hasPaidForEnrollment = useCallback((user) => {
    return user.status === "5";
  }, []);

  // Calculate revenue from a user
  const calculateUserRevenue = useCallback((user) => {
    let revenue = 0;

    // Add 5000 if user status is "5" (paid)
    if (user.status === "5") {
      revenue += 5000;
    }

    // Add additional course payments
    if (
      user.additionalCourses_paid_invoice &&
      Array.isArray(user.additionalCourses_paid_invoice)
    ) {
      user.additionalCourses_paid_invoice.forEach((invoice) => {
        if (invoice.totalAmount) {
          revenue += invoice.totalAmount;
        }
      });
    }

    return revenue;
  }, []);

  // Fetch overall stats from overallstats document
  const fetchOverallStats = useCallback(async () => {
    try {
      setLoadingStates((prev) => ({ ...prev, overall: true }));
      const overallStatsDoc = await getDoc(
        doc(firestore, "overallstats", "overallstats")
      );

      if (overallStatsDoc.exists()) {
        const data = overallStatsDoc.data();
        setOverallStats({
          totalEnrolledStudents: data.totalEnrolledStudents || 0,
          totalRevenue: data.totalRevenue || 0,
          totalUsers: data.totalUsers || 0,
          totalTestsPassed: data.totalTestsPassed || 0,
          totalTestsFailed: data.totalTestsFailed || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching overall stats:", error);
      showToast("Error fetching overall stats", "error", 5000);
    } finally {
      setLoadingStates((prev) => ({ ...prev, overall: false }));
    }
  }, [showToast]);

  // Fetch signups data
  const fetchSignupsData = useCallback(async () => {
    try {
      setLoadingStates((prev) => ({ ...prev, signups: true }));

      const todayRange = getPakistanDateRange(0);
      const yesterdayRange = getPakistanDateRange(-1);

      // Validate date ranges before using them
      if (
        !todayRange.start ||
        !todayRange.end ||
        !yesterdayRange.start ||
        !yesterdayRange.end
      ) {
        throw new Error("Invalid date range for signups query");
      }

      // Fetch today's signups - use orderBy to help with the query
      const todayQuery = query(
        collection(firestore, "users"),
        where("created_at", ">=", todayRange.start),
        where("created_at", "<=", todayRange.end),
        orderBy("created_at", "desc")
      );

      // Fetch yesterday's signups
      const yesterdayQuery = query(
        collection(firestore, "users"),
        where("created_at", ">=", yesterdayRange.start),
        where("created_at", "<=", yesterdayRange.end),
        orderBy("created_at", "desc")
      );

      const [todaySnapshot, yesterdaySnapshot] = await Promise.all([
        getDocs(todayQuery),
        getDocs(yesterdayQuery),
      ]);

      setSignupsData({
        today: todaySnapshot.size,
        yesterday: yesterdaySnapshot.size,
      });
    } catch (error) {
      console.error("Error fetching signups data:", error);
      setIndexError({
        message: error.message,
        query: "Signups",
      });
      showToast(
        "Error fetching signups data. Check console for details.",
        "error",
        5000
      );
    } finally {
      setLoadingStates((prev) => ({ ...prev, signups: false }));
    }
  }, [getPakistanDateRange, showToast]);

  // Fetch test passed and attempted data
  const fetchTestData = useCallback(async () => {
    try {
      setLoadingStates((prev) => ({
        ...prev,
        testPassed: true,
        testAttempted: true,
      }));

      const todayRange = getPakistanDateRange(0);
      const yesterdayRange = getPakistanDateRange(-1);

      // Validate date ranges before using them
      if (
        !todayRange.start ||
        !todayRange.end ||
        !yesterdayRange.start ||
        !yesterdayRange.end
      ) {
        throw new Error("Invalid date range for test query");
      }

      // Today's test attempts (status changed from "2" to "3" or "4")
      // We'll query users with status "3" or "4" and check their updated_at
      const todayAttemptQuery = query(
        collection(firestore, "users"),
        where("status", "in", ["3", "4"]),
        where("updated_at", ">=", todayRange.start),
        where("updated_at", "<=", todayRange.end),
        orderBy("updated_at", "desc")
      );

      // Yesterday's test attempts
      const yesterdayAttemptQuery = query(
        collection(firestore, "users"),
        where("status", "in", ["3", "4"]),
        where("updated_at", ">=", yesterdayRange.start),
        where("updated_at", "<=", yesterdayRange.end),
        orderBy("updated_at", "desc")
      );

      // Today's test passes (status changed from "2" to "4")
      const todayPassQuery = query(
        collection(firestore, "users"),
        where("status", "==", "4"),
        where("updated_at", ">=", todayRange.start),
        where("updated_at", "<=", todayRange.end),
        orderBy("updated_at", "desc")
      );

      // Yesterday's test passes
      const yesterdayPassQuery = query(
        collection(firestore, "users"),
        where("status", "==", "4"),
        where("updated_at", ">=", yesterdayRange.start),
        where("updated_at", "<=", yesterdayRange.end),
        orderBy("updated_at", "desc")
      );

      const [
        todayAttemptSnapshot,
        yesterdayAttemptSnapshot,
        todayPassSnapshot,
        yesterdayPassSnapshot,
      ] = await Promise.all([
        getDocs(todayAttemptQuery),
        getDocs(yesterdayAttemptQuery),
        getDocs(todayPassQuery),
        getDocs(yesterdayPassQuery),
      ]);

      setTestAttemptedData({
        today: todayAttemptSnapshot.size,
        yesterday: yesterdayAttemptSnapshot.size,
      });

      setTestPassedData({
        today: todayPassSnapshot.size,
        yesterday: yesterdayPassSnapshot.size,
      });
    } catch (error) {
      console.error("Error fetching test data:", error);
      setIndexError({
        message: error.message,
        query: "Test Statistics",
      });
      showToast(
        "Error fetching test data. Check console for details.",
        "error",
        5000
      );
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        testPassed: false,
        testAttempted: false,
      }));
    }
  }, [getPakistanDateRange, showToast]);

  // Fetch enrolled and revenue data
  const fetchEnrolledAndRevenueData = useCallback(async () => {
    try {
      setLoadingStates((prev) => ({ ...prev, enrolled: true, revenue: true }));

      const todayRange = getPakistanDateRange(0);
      const yesterdayRange = getPakistanDateRange(-1);

      // Validate date ranges before using them
      if (
        !todayRange.start ||
        !todayRange.end ||
        !yesterdayRange.start ||
        !yesterdayRange.end
      ) {
        throw new Error("Invalid date range for enrollment query");
      }

      // Fetch all users for today and yesterday to check payment status
      const todayQuery = query(
        collection(firestore, "users"),
        where("created_at", ">=", todayRange.start),
        where("created_at", "<=", todayRange.end),
        orderBy("created_at", "desc")
      );

      const yesterdayQuery = query(
        collection(firestore, "users"),
        where("created_at", ">=", yesterdayRange.start),
        where("created_at", "<=", yesterdayRange.end),
        orderBy("created_at", "desc")
      );

      // Also fetch all users with status "5" to calculate total revenue
      const paidUsersQuery = query(
        collection(firestore, "users"),
        where("status", "==", "5"),
        orderBy("created_at", "desc")
      );

      const [todaySnapshot, yesterdaySnapshot, paidUsersSnapshot] =
        await Promise.all([
          getDocs(todayQuery),
          getDocs(yesterdayQuery),
          getDocs(paidUsersQuery),
        ]);

      let todayEnrolledCount = 0;
      let yesterdayEnrolledCount = 0;
      let todayRevenue = 0;
      let yesterdayRevenue = 0;
      let totalRevenue = 0;

      // Process today's data
      todaySnapshot.docs.forEach((doc) => {
        const user = doc.data();

        // Check if user has paid for enrollment (status "5")
        if (hasPaidForEnrollment(user)) {
          todayEnrolledCount++;

          // Calculate revenue from this user
          const userRevenue = calculateUserRevenue(user);
          todayRevenue += userRevenue;
        }
      });

      // Process yesterday's data
      yesterdaySnapshot.docs.forEach((doc) => {
        const user = doc.data();

        // Check if user has paid for enrollment (status "5")
        if (hasPaidForEnrollment(user)) {
          yesterdayEnrolledCount++;

          // Calculate revenue from this user
          const userRevenue = calculateUserRevenue(user);
          yesterdayRevenue += userRevenue;
        }
      });

      // Process all paid users for total revenue
      paidUsersSnapshot.docs.forEach((doc) => {
        const user = doc.data();
        const userRevenue = calculateUserRevenue(user);
        totalRevenue += userRevenue;
      });

      setEnrolledData({
        today: todayEnrolledCount,
        yesterday: yesterdayEnrolledCount,
      });

      setRevenueData({
        today: todayRevenue,
        yesterday: yesterdayRevenue,
      });

      // Update overall stats with calculated revenue
      setOverallStats((prev) => ({
        ...prev,
        totalRevenue: totalRevenue,
      }));
    } catch (error) {
      console.error("Error fetching enrolled and revenue data:", error);
      setIndexError({
        message: error.message,
        query: "Revenue",
      });
      showToast(
        "Error fetching revenue data. Check console for details.",
        "error",
        5000
      );
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        enrolled: false,
        revenue: false,
      }));
    }
  }, [
    getPakistanDateRange,
    hasPaidForEnrollment,
    calculateUserRevenue,
    showToast,
  ]);

  // Fetch admins data
  const fetchAdminsData = useCallback(async () => {
    try {
      setLoadingStates((prev) => ({ ...prev, admins: true }));
      const adminsSnapshot = await getDocs(
        collection(firestore, "site_admins_details")
      );
      setAdminsData(
        adminsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    } catch (error) {
      console.error("Error fetching admins:", error);
      showToast("Error fetching admins data", "error", 5000);
    } finally {
      setLoadingStates((prev) => ({ ...prev, admins: false }));
    }
  }, [showToast]);

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    setIsRefreshing(true);
    setIndexError(null);

    try {
      await Promise.all([
        fetchOverallStats(),
        fetchAdminsData(),
        fetchSignupsData(),
        fetchTestData(),
        fetchEnrolledAndRevenueData(),
      ]);
      setLastUpdated(new Date());
      setDataFetched(true);
      showToast("Data refreshed successfully", "success", 3000);
    } catch (error) {
      console.error("Error refreshing data:", error);
      showToast("Error refreshing data. Please try again.", "error", 5000);
    } finally {
      setIsRefreshing(false);
    }
  }, [
    fetchOverallStats,
    fetchAdminsData,
    fetchSignupsData,
    fetchTestData,
    fetchEnrolledAndRevenueData,
    showToast,
  ]);

  // Get selected data based on time period
  const getSelectedData = useCallback(
    (data) => {
      return timePeriod === "today" ? data.today : data.yesterday;
    },
    [timePeriod]
  );

  // Get time period prefix
  const getTimePeriodPrefix = useCallback(() => {
    return timePeriod === "today" ? "Today's" : "Yesterday's";
  }, [timePeriod]);

  // Calculate trend percentage
  const calculateTrend = useCallback((today, yesterday) => {
    if (yesterday === 0)
      return { direction: "up", percentage: today > 0 ? 100 : 0 };
    const change = ((today - yesterday) / yesterday) * 100;
    return {
      direction: change >= 0 ? "up" : "down",
      percentage: Math.abs(change).toFixed(1),
    };
  }, []);

  // Stat Card Component
  const StatCard = ({
    title,
    value,
    icon,
    iconColor,
    link,
    loading,
    error,
    showTrend = false,
    trendData,
    className = "",
  }) => {
    const trend =
      showTrend && trendData
        ? calculateTrend(trendData.today, trendData.yesterday)
        : null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`group relative bg-white border border-gray-200/80 rounded-2xl p-6 
                   hover:border-gray-300/80 hover:shadow-lg transition-all duration-300 ${className}`}
      >
        {/* Background accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent rounded-2xl opacity-60"></div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
                {title}
              </p>

              {loading ? (
                <div className="animate-pulse h-8 w-3/4 bg-gray-200 rounded"></div>
              ) : error ? (
                <p className="text-red-500 text-sm">{error}</p>
              ) : (
                <p className="text-3xl font-bold text-gray-900 tracking-tight">
                  {value}
                </p>
              )}
            </div>

            <div
              className={`p-3 rounded-xl ${iconColor} flex items-center justify-center`}
            >
              {icon}
            </div>
          </div>

          {/* Trend indicator */}
          {trend && trend.percentage > 0 && (
            <div className="flex items-center mb-4">
              <div
                className={`flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                ${
                  trend.direction === "up"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {trend.direction === "up" ? (
                  <FaArrowUp className="w-3 h-3 mr-1" />
                ) : (
                  <FaArrowDown className="w-3 h-3 mr-1" />
                )}
                {trend.percentage}%
              </div>
              <span className="text-xs text-gray-500 ml-2">
                vs previous day
              </span>
            </div>
          )}

          {/* Action link */}
          <Link
            href={link}
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 
                       group-hover:translate-x-1 transition-all duration-200"
          >
            View details
            <HiOutlineChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Hover effect overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        ></div>
      </motion.div>
    );
  };

  return (
    <AdminProtectedRoutes>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-10">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between"
            >
              <div className="mb-4 sm:mb-0">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Welcome back,
                  </span>{" "}
                  {adminLoading ? (
                    <span className="inline-block animate-pulse bg-gray-300 h-8 w-32 rounded"></span>
                  ) : (
                    adminData?.admin_name || "Admin"
                  )}
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl">
                  Monitor your platform's performance with daily insights and
                  comprehensive analytics
                </p>
                {lastUpdated && (
                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    <HiOutlineCalendar className="w-4 h-4 mr-1" />
                    Last updated: {formatTime(lastUpdated)}
                  </div>
                )}
              </div>

              {/* Fetch Data button - only show if data hasn't been fetched yet */}
              {!dataFetched && (
                <button
                  onClick={refreshAllData}
                  disabled={isRefreshing}
                  className={`flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg 
                            hover:bg-blue-700 transition-all duration-200 font-medium
                            ${isRefreshing ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <FiRefreshCw
                    className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  {isRefreshing ? "Fetching Data..." : "Fetch Dashboard Data"}
                </button>
              )}

              {/* Refresh button - only show after data has been fetched */}
              {dataFetched && (
                <button
                  onClick={refreshAllData}
                  disabled={isRefreshing}
                  className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg 
                            hover:bg-blue-700 transition-all duration-200
                            ${isRefreshing ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <FiRefreshCw
                    className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  {isRefreshing ? "Refreshing..." : "Refresh Data"}
                </button>
              )}
            </motion.div>
          </div>

          {/* Show placeholder if data hasn't been fetched yet */}
          {!dataFetched ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 max-w-md text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiRefreshCw className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  No Data Available Yet
                </h2>
                <p className="text-gray-600 mb-6">
                  Click "Fetch Dashboard Data" button to load the latest
                  statistics and analytics.
                </p>
                <button
                  onClick={refreshAllData}
                  disabled={isRefreshing}
                  className={`flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg 
                            hover:bg-blue-700 transition-all duration-200 font-medium mx-auto
                            ${isRefreshing ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <FiRefreshCw
                    className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  {isRefreshing ? "Fetching Data..." : "Fetch Dashboard Data"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Time Period Selector */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-8"
              >
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-xl p-4 inline-flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">
                    View Data For:
                  </span>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    {["today", "yesterday"].map((period) => (
                      <button
                        key={period}
                        onClick={() => setTimePeriod(period)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 capitalize
                        ${
                          timePeriod === period
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Overview Stats */}
              <div className="mb-12">
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-gray-900 mb-6"
                >
                  Platform Overview
                </motion.h2>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
                  <StatCard
                    title="Site Admins"
                    value={adminsData.length.toString()}
                    link="/admin/dashboard/manage-admins"
                    iconColor="bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600"
                    icon={<RiAdminFill className="w-6 h-6" />}
                    loading={loadingStates.admins}
                  />

                  <StatCard
                    title="Total Users"
                    value={overallStats.totalUsers.toLocaleString()}
                    link="/admin/dashboard/users"
                    iconColor="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600"
                    icon={<FaUsers className="w-6 h-6" />}
                    loading={loadingStates.overall}
                  />

                  <StatCard
                    title="Tests Passed"
                    value={
                      overallStats.totalTestsPassed?.toLocaleString() || "0"
                    }
                    link="/admin/dashboard/users"
                    iconColor="bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600"
                    icon={<FaCheckCircle className="w-6 h-6" />}
                    loading={loadingStates.overall}
                  />

                  <StatCard
                    title="Tests Failed"
                    value={
                      overallStats.totalTestsFailed?.toLocaleString() || "0"
                    }
                    link="/admin/dashboard/users"
                    iconColor="bg-gradient-to-br from-red-100 to-pink-100 text-red-600"
                    icon={<FaTimesCircle className="w-6 h-6" />}
                    loading={loadingStates.overall}
                  />

                  <StatCard
                    title="Total Revenue"
                    value={`PKR ${(overallStats.totalRevenue / 1000000).toFixed(
                      1
                    )}M`}
                    link="/admin/dashboard/payments"
                    iconColor="bg-gradient-to-br from-purple-100 to-fuchsia-100 text-purple-600"
                    icon={<FaDollarSign className="w-6 h-6" />}
                    loading={loadingStates.overall}
                  />
                </div>
              </div>

              {/* Daily Statistics */}
              <div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-between mb-6"
                >
                  <h2 className="text-2xl font-bold text-gray-900">
                    Daily Statistics
                  </h2>
                  <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    Pakistan Time Zone (UTC+5)
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3 }}
                    >
                      <StatCard
                        title={`${getTimePeriodPrefix()} Signups`}
                        value={getSelectedData(signupsData).toString()}
                        link="/admin/dashboard/users"
                        iconColor="bg-gradient-to-br from-purple-100 to-fuchsia-100 text-purple-600"
                        icon={<FaUsers className="w-6 h-6" />}
                        loading={loadingStates.signups}
                        showTrend={true}
                        trendData={signupsData}
                      />
                    </motion.div>
                  </AnimatePresence>

                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <StatCard
                        title={`${getTimePeriodPrefix()} Tests Passed`}
                        value={getSelectedData(testPassedData).toString()}
                        link="/admin/dashboard/users"
                        iconColor="bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600"
                        icon={<FaCheckCircle className="w-6 h-6" />}
                        loading={loadingStates.testPassed}
                        showTrend={true}
                        trendData={testPassedData}
                      />
                    </motion.div>
                  </AnimatePresence>

                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      <StatCard
                        title={`${getTimePeriodPrefix()} Tests Attempted`}
                        value={getSelectedData(testAttemptedData).toString()}
                        link="/admin/dashboard/users"
                        iconColor="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600"
                        icon={<PiStudent className="w-6 h-6" />}
                        loading={loadingStates.testAttempted}
                        showTrend={true}
                        trendData={testAttemptedData}
                      />
                    </motion.div>
                  </AnimatePresence>

                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      <StatCard
                        title={`${getTimePeriodPrefix()} Enrolled`}
                        value={getSelectedData(enrolledData).toString()}
                        link="/admin/dashboard/users"
                        iconColor="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600"
                        icon={<PiStudent className="w-6 h-6" />}
                        loading={loadingStates.enrolled}
                        showTrend={true}
                        trendData={enrolledData}
                      />
                    </motion.div>
                  </AnimatePresence>

                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      <StatCard
                        title={`${getTimePeriodPrefix()} Revenue`}
                        value={`PKR ${(
                          getSelectedData(revenueData) / 1000
                        ).toFixed(0)}K`}
                        link="/admin/dashboard/payments"
                        iconColor="bg-gradient-to-br from-amber-100 to-yellow-100 text-amber-600"
                        icon={<FaDollarSign className="w-6 h-6" />}
                        loading={loadingStates.revenue}
                        showTrend={true}
                        trendData={revenueData}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer spacing */}
              <div className="h-16"></div>
            </>
          )}

          {/* Error message with index creation instructions */}
          {indexError && (
            <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-1">
                  <p className="text-red-800 font-medium mb-2">
                    Error fetching {indexError.query} data
                  </p>
                  <p className="text-red-600 text-sm mb-3">
                    {indexError.message}
                  </p>
                  <p className="text-red-600 text-sm mb-3">
                    If this error mentions a missing index, check console for a
                    direct link to create it.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Firestore Indexes Info */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-1">
                <p className="text-blue-800 font-medium mb-2">
                  Required Firestore Indexes
                </p>
                <p className="text-blue-600 text-sm mb-3">
                  The first time you fetch data, Firestore may report missing
                  indexes. The error message will include a direct link to
                  create each required index.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-white p-2 rounded border border-blue-200">
                    <span className="text-sm font-medium">Signups Query</span>
                    <span className="text-xs text-gray-500">
                      Collection: users | Field: created_at (Single Field Index)
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2 rounded border border-blue-200">
                    <span className="text-sm font-medium">Test Statistics</span>
                    <span className="text-xs text-gray-500">
                      Collection: users | Fields: status (ASC), updated_at (ASC)
                      (Composite Index)
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2 rounded border border-blue-200">
                    <span className="text-sm font-medium">Revenue Query</span>
                    <span className="text-xs text-gray-500">
                      Collection: users | Field: status (Single Field Index)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminProtectedRoutes>
  );
};

export default StatisticsPage;
