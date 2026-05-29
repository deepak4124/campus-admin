import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "School Admin Panel",
  description: "Admin portal for school operations."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
