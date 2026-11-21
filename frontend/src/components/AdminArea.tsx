"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminPortal from "@/components/portals/AdminPortal";

export default function AdminArea() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const role = window.localStorage.getItem("lex-supermus-user-role");
    const hasName = Boolean(window.localStorage.getItem("lex-supermus-user-name"));
    if (role === "ADMIN" && hasName) {
      setAuthorized(true);
      return;
    }
    setAuthorized(false);
  }, [router]);

  if (!authorized) {
    return (
      <div className="panel">
        <h1>Administrator access</h1>
        <p className="sub">This area is restricted to provisioned administrator accounts.</p>
        <div className="notice">No public administrator registration or hidden login is provided.</div>
      </div>
    );
  }

  return <AdminPortal />;
}
