"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { firestore } from "@/Backend/Firebase";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  orderBy,
  getDoc,
} from "firebase/firestore";
import SidebarWrapper from "@/adminComponents/SidebarWrapper";
import {
  FaPrint,
  FaCog,
  FaTruck,
  FaSearch,
  FaFilter,
  FaSync,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/primary/Toast";
import { ImSpinner } from "react-icons/im";

const CHCCONTENT = () => {
  const { showToast } = useToast();
  const [certificates, setCertificates] = useState([]);
  const [activeTab, setActiveTab] = useState("printing");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("issuedAt");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [userDetails, setUserDetails] = useState({});
  const activeTabRef = useRef(activeTab);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Update ref when activeTab changes
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Check URL for status parameter every second
  useEffect(() => {
    const checkUrlStatus = () => {
      const status = searchParams.get("status") || "printing";
      if (status && status !== activeTabRef.current) {
        setActiveTab(status);
      }
    };

    checkUrlStatus();
    const intervalId = setInterval(checkUrlStatus, 1000);

    return () => clearInterval(intervalId);
  }, [searchParams]);

  // Fetch user details by email
  const fetchUserDetails = async (email) => {
    try {
      if (!email || userDetails[email]) return;

      const userDocRef = doc(firestore, "users", email);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const { password, ...safeUserData } = userData;
        setUserDetails((prev) => ({
          ...prev,
          [email]: safeUserData,
        }));
      } else {
        showToast(`User not found for email: ${email}`, "error", 5000);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      showToast("Failed to fetch user details.", "error", 5000);
    }
  };

  // Fetch ALL certificates in real-time
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(firestore, "certificates"),
      orderBy(sortBy, sortBy === "issuedAt" ? "desc" : "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const certsData = snapshot.docs.map((doc) => {
            const data = doc.data();
            const issuedAt = data.issuedAt
              ? data.issuedAt.seconds
                ? new Date(data.issuedAt.seconds * 1000)
                : new Date(data.issuedAt)
              : null;

            const paidAt = data.paidAt
              ? data.paidAt.seconds
                ? new Date(data.paidAt.seconds * 1000)
                : new Date(data.paidAt)
              : null;

            return {
              id: doc.id,
              ...data,
              issuedAt,
              paidAt,
            };
          });

          setCertificates(certsData);
          setLastUpdated(new Date().toLocaleTimeString());

          // Fetch user details for each certificate
          certsData.forEach((cert) => {
            if (cert.email) {
              fetchUserDetails(cert.email);
            }
          });
        } catch (error) {
          console.error("Error processing certificates snapshot:", error);
          showToast("Error processing certificates data.", "error", 5000);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error fetching certificates:", error);
        setLoading(false);
        if (error.message.includes("index")) {
          showToast(
            "Missing Firestore index for certificates query. Check console for details.",
            "error",
            5000
          );
        } else {
          showToast("Failed to fetch certificates.", "error", 5000);
        }
      }
    );

    return () => unsubscribe();
  }, [sortBy, showToast]);

  // Update certificate status
  const updateStatus = async (id, newStatus) => {
    try {
      const certRef = doc(firestore, "certificates", id);
      await updateDoc(certRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      showToast(`Certificate status updated to ${newStatus}`, "success", 5000);
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("Failed to update certificate status.", "error", 5000);
    }
  };

  // Filter certificates by active tab and search term
  const filteredCerts = certificates.filter(
    (cert) =>
      (activeTab === "all" || cert.status === activeTab) &&
      (cert.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.cnic?.includes(searchTerm) ||
        cert.verificationId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get counts for each status
  const statusCounts = {
    printing: certificates.filter((c) => c.status === "printing").length,
    processing: certificates.filter((c) => c.status === "processing").length,
    delivered: certificates.filter((c) => c.status === "delivered").length,
    all: certificates.length,
  };

  // Status configuration
  const statusConfig = {
    printing: {
      label: "Printing",
      icon: <FaPrint className="text-yellow-600" />,
      color: "bg-yellow-100 border-yellow-300",
      nextStatus: "processing",
      nextLabel: "Move to Processing",
    },
    processing: {
      label: "Processing",
      icon: <FaCog className="text-blue-600" />,
      color: "bg-blue-100 border-blue-300",
      prevStatus: "printing",
      nextStatus: "delivered",
      prevLabel: "Back to Printing",
      nextLabel: "Mark as Delivered",
    },
    delivered: {
      label: "Delivered",
      icon: <FaTruck className="text-green-600" />,
      color: "bg-green-100 border-green-300",
      prevStatus: "processing",
      prevLabel: "Back to Processing",
    },
  };

  return (
    <>
      <SidebarWrapper>
        <div className="min-h-screen bg-gray-50">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Certificate Requests
                </h1>
                <p className="text-gray-600">
                  Manage and track certificate requests
                </p>
              </div>
              <div className="text-sm text-gray-600 flex items-center">
                <FaSync className="mr-2" />
                Last updated: {lastUpdated}
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200 shadow-sm">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Status Tabs */}
                <div className="flex flex-wrap gap-2">
                  {Object.keys(statusConfig).map((status) => (
                    <button
                      key={status}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all border ${
                        activeTab === status
                          ? `${statusConfig[status].color} text-gray-800 shadow-sm`
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        setActiveTab(status);
                        router.push(
                          `/admin/dashboard/chc-requests?status=${status}`
                        );
                      }}
                    >
                      {statusConfig[status].icon}
                      <span>{statusConfig[status].label}</span>
                      <span className="bg-white bg-opacity-80 px-2 py-1 rounded-md text-xs border">
                        {statusCounts[status]}
                      </span>
                    </button>
                  ))}
                  <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all border ${
                      activeTab === "all"
                        ? "bg-purple-100 border-purple-300 text-gray-800 shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      setActiveTab("all");
                      router.push("/admin/dashboard/chc-requests?status=all");
                    }}
                  >
                    <FaFilter className="text-purple-600" />
                    <span>All Requests</span>
                    <span className="bg-white bg-opacity-80 px-2 py-1 rounded-md text-xs border">
                      {statusCounts.all}
                    </span>
                  </button>
                </div>

                {/* Search and Sort */}
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search requests..."
                      className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="issuedAt">Sort by: Newest</option>
                    <option value="fullName">Sort by: Name</option>
                    <option value="name">Sort by: Course</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Certificates List */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredCerts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-xl font-medium text-gray-800 mb-2">
                  No certificates found
                </h3>
                <p className="text-gray-600">
                  {searchTerm
                    ? "Try adjusting your search term"
                    : `No certificates in ${
                        statusConfig[activeTab]?.label || "this category"
                      }`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCerts.map((cert) => {
                  const user = userDetails[cert.email] || {};
                  return (
                    <div
                      key={cert.id}
                      className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm transition-transform hover:scale-[1.02] hover:shadow-md"
                    >
                      <div
                        className={`p-4 ${
                          statusConfig[cert.status]?.color ||
                          "bg-gray-100 border-gray-300"
                        } border-b flex justify-between items-center`}
                      >
                        <div className="flex items-center gap-2">
                          {statusConfig[cert.status]?.icon || (
                            <FaCog className="text-gray-600" />
                          )}
                          <span className="font-medium text-gray-800">
                            {statusConfig[cert.status]?.label || cert.status}
                          </span>
                        </div>
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded border">
                          {cert.verificationId}
                        </span>
                      </div>

                      <div className="p-4">
                        <h3 className="font-bold text-lg text-gray-900 truncate">
                          {cert.fullName}
                        </h3>
                        <p className="text-blue-600 font-medium">
                          {cert.name}
                        </p>

                        <div className="mt-4 space-y-2 text-sm text-gray-700">
                          <div className="flex justify-between">
                            <span className="text-gray-500">CNIC:</span>
                            <span>{cert.cnic || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Email:</span>
                            <span className="truncate">
                              {cert.email || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Issued:</span>
                            <span>
                              {cert.issuedAt
                                ? cert.issuedAt.toLocaleDateString()
                                : "N/A"}
                            </span>
                          </div>
                          {cert.paidAt && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Paid:</span>
                              <span>{cert.paidAt.toLocaleDateString()}</span>
                            </div>
                          )}
                          {cert.adresss && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Address:</span>
                              <span>{cert.adresss}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex mt-4 gap-2">
                          {cert.status === "printing" && (
                            <button
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                              onClick={() =>
                                updateStatus(cert.id, "processing")
                              }
                            >
                              <FaCog />
                              {statusConfig.printing.nextLabel}
                            </button>
                          )}

                          {cert.status === "processing" && (
                            <>
                              <button
                                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                                onClick={() =>
                                  updateStatus(cert.id, "printing")
                                }
                              >
                                <FaPrint />
                                {statusConfig.processing.prevLabel}
                              </button>
                              <button
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                                onClick={() =>
                                  updateStatus(cert.id, "delivered")
                                }
                              >
                                <FaTruck />
                                {statusConfig.processing.nextLabel}
                              </button>
                            </>
                          )}

                          {cert.status === "delivered" && (
                            <button
                              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                              onClick={() =>
                                updateStatus(cert.id, "processing")
                              }
                            >
                              <FaCog />
                              Back to Processing
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </SidebarWrapper>
    </>
  );
};

const CHC = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-700">
            <ImSpinner className="animate-spin text-2xl" />
            <span>Loading CHC Content...</span>
          </div>
        </div>
      }
    >
      <CHCCONTENT />
    </Suspense>
  );
};
export default CHC;
