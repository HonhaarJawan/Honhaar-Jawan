import useAdmin from "@/Hooks/adminHooks";
import React from "react";

const AdminDetails = () => {
  const { adminData } = useAdmin();

  return (
    <div className="pt-5">
      <h2 className="capitalize text-xl font-medium leading-9">Welcome Back, {adminData?.role}</h2>
      <h5 className="capitalize text-sm">Let's get things done!</h5>
    </div>
  );
};

export default AdminDetails;