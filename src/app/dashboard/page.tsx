import { redirect } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { verifySession } from "@/lib/auth";
import { getDashboardSnapshot } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!(await verifySession())) redirect("/login");
  const snapshot = await getDashboardSnapshot();
  return <Dashboard snapshot={snapshot} />;
}

