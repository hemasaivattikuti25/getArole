import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "getArole — Developer Job Discovery & Resume Matcher",
  description:
    "Find open developer roles, match your resume directly against requirements, and track your applications in one place.",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "getArole — Developer Job Discovery & Resume Matcher",
    description:
      "Find open developer roles and match your resume directly against requirements.",
    url: "https://getarole.in",
    siteName: "getArole",
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" style={{ colorScheme: "light" }}>
      <body
        className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} font-sans bg-white text-slate-900 min-h-screen flex flex-col antialiased selection:bg-[#0062e3] selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
