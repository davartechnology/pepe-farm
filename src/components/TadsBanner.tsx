import type { Metadata } from "next";
import Script from "next/script";
import BottomNav from "@/components/BottomNav";
import TadsProvider from "@/components/TadsProvider";

export const metadata: Metadata = {
  title: "PEPE FARM",
  description: "Farm des PEPE gratuitement et retire sur FaucetPay",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-[#1A1400]">
        <TadsProvider>
          {children}
          <BottomNav />
        </TadsProvider>
      </body>
    </html>
  );
}