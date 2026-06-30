import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Blooming Daffodils",
  description: "Planted to Grow, Destined to Flourish",
  icons: {
    icon: "/bdps-removebg-preview.png",
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
