import type { Metadata } from "next";

import QueryProvider from "@/app/providers/QueryProvider";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Multi-tenant AI Assistant",
  description: "Config-driven dashboard and tenant-aware AI chat",
  icons: {
    icon: "/favicon.ico"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
