import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/providers/auth-provider";
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
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media (max-width: 640px) { input, select, textarea { font-size: max(16px, 1rem); font-size: 16px !important; } }
              @media (prefers-reduced-motion: reduce) { *, ::before, ::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; } }
              .nav-tabs { overflow-x: auto; -webkit-overflow-scrolling: touch; }
              .fixed-header { transform: translateZ(0); -webkit-backdrop-filter: blur(12px); }
              .app-viewport-root { min-height: 100vh; min-height: -webkit-fill-available; min-height: 100dvh; }
              .app-container-max { max-width: 1500px; }
              .skip-link { position: absolute; top: -40px; left: 0; background: #0062e3; color: white; padding: 8px 16px; z-index: 100; transition: top 0.2s ease; }
              .skip-link:focus { top: 0; }
            `,
          }}
        />
      </head>
      <body
        className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} font-sans bg-white text-slate-900 min-h-screen flex flex-col antialiased selection:bg-[#0062e3] selection:text-white`}
      >
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col w-full">
          <AuthProvider>{children}</AuthProvider>
        </main>
      </body>
    </html>
  );
}

