"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState, type ReactNode } from "react";

// ReactQueryDevtools only in dev — zero production bundle cost
const ReactQueryDevtools =
  process.env.NODE_ENV === "development"
    ? require("@tanstack/react-query-devtools").ReactQueryDevtools
    : () => null;

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
            // Structural sharing on by default — object references reused for
            // unchanged data, preventing unnecessary child re-renders
            structuralSharing: true,
            // Don't refetch on window focus for kitchen/real-time views
            // (sockets handle updates); analytics pages have their own staleTime
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-right" />
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
