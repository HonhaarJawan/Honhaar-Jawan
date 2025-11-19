"use client";
import React, { useState, useEffect } from "react";
import useAuthStore from "@/store/useAuthStore";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Navbar from "@/components/primary/Navbar";
import Header from "@/components/primary/Header";
import { firestore } from "@/Backend/Firebase";
import Testfailed from "./pages/TestFailed";
import Testpassed from "./pages/TestPassed";
import Enrollment from "./pages/Enrollment";
import OnlineTest from "./pages/OnlineTest";
import OnlineTestList from "./pages/OnlineTestList";

const Dashboard = () => {
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    if (typeof window === 'undefined') return; // Check if running on server-side
    if (!user?.email) return;

    const usersRef = collection(firestore, "users");
    const q = query(usersRef, where("email", "==", user.email));

    const unsubscribe = onSnapshot(
      q,
      (qs) => {
        if (!qs.empty) {
          const data = qs.docs[0].data();
          setUser({ ...user, ...data }); // ✅ Update global auth store
        }
      },
      console.error
    );

    return unsubscribe;
  }, [user?.email, setUser]);

  return (
    <div>
      <Navbar />
        <div className="mt-16">
        {user?.status === 1 && <OnlineTestList user={user} />}
        {user?.status === 2 && <OnlineTest user={user} />}
        {user?.status === 3 && <Testfailed user={user} />}
        {user?.status === 4 && <Testpassed user={user} />}
        {user?.status === 5 && <Enrollment user={user} />}
      </div>
    </div>
  );
};
// app/api/cron/approval-cron

export default Dashboard;
