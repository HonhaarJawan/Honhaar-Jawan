"use client";
import React from "react";
import SidebarWrapper from "@/adminComponents/SidebarWrapper";
import AdminProtectedRoutes from "@/ProtectedRoutes/AdminProtectedRoutes";
import StatisticsPage from "../statistics/page";


const AdminDashboard = () => {
  return (
    <AdminProtectedRoutes>
      <div>
        <SidebarWrapper>
          <StatisticsPage />
        </SidebarWrapper>
      </div>
    </AdminProtectedRoutes>
  );
};

export default AdminDashboard;
