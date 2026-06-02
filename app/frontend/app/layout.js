import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "VulnLab",
  description: "Intentionally Vulnerable Web App — QA & Security Portfolio",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="bg-red-950 text-red-300 text-center py-2 px-4 text-xs font-mono tracking-wide">
          ⚠️ VulnLab — Intentionally Vulnerable App for Educational Purposes Only. Do Not Submit Real Personal Data.
        </div>
        {children}
      </body>
    </html>
  );
}