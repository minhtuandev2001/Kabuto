import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Learn Japan",
  description: "Học từ vựng Minna no Nihongo bằng tai",
  applicationName: "Learn Japan",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Learn Japan",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#F6F3FF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={`${nunito.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
