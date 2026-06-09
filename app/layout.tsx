import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/providers/providers";

console.log("[DIAGNOSTIC] app/layout.tsx module loaded");

export const metadata: Metadata = {
  title: "SpiceAdmin — Restaurant Dashboard",
  description: "Admin dashboard for restaurant management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  console.log("[DIAGNOSTIC] app/layout.tsx component rendering");
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
