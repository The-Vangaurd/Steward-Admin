"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";

function getRedirectPath(role: string): string {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "/dashboard";
  if (role === "KITCHEN_STAFF") return "/kitchen";
  if (role === "WAITER") return "/kitchen";
  return "/dashboard";
}

export default function RootPage() {
  const router = useRouter();
  const { accessToken, user } = useAuthStore();

  useEffect(() => {
    if (!accessToken || !user) {
      router.replace("/login");
    } else {
      router.replace(getRedirectPath(user.role));
    }
  }, [accessToken, user, router]);

  return null;
}
