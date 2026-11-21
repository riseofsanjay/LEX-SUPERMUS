import type { Metadata } from "next";
import LawFirmPortal from "@/components/portals/LawFirmPortal";
import RoleAccessGate from "@/components/RoleAccessGate";

export const metadata: Metadata = { title: "Law Firm Workspace | LEX SUPERMUS" };

export default function FirmPage() {
  return (
    <section id="firm" className="page">
      <RoleAccessGate role="LAW_FIRM">
        <LawFirmPortal />
      </RoleAccessGate>
    </section>
  );
}
