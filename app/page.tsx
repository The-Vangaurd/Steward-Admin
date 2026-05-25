import { redirect } from "next/navigation";

/**
 * Root redirect — sends all traffic to /dashboard.
 * The dashboard layout handles auth-gating and role routing.
 */
export default function RootPage() {
  redirect("/dashboard");
}
