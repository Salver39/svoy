import type { Metadata, Viewport } from "next";
import { Spectral, Golos_Text } from "next/font/google";
import "./globals.css";
import { PWARegister } from "@/components/PWARegister";

// Дизайн-система Svoy (DESIGN.md): Spectral — дисплей/герой, Golos Text — тело/UI.
// Кириллица обязательна (UI на русском). Self-host рассмотреть перед проду.
const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin", "cyrillic"],
  weight: ["500"],
  display: "swap",
});

const golos = Golos_Text({
  variable: "--font-golos",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Svoy",
  description:
    "Дневник питания, который помогает следить за едой, не разгоняя тревогу.",
};

export const viewport: Viewport = {
  themeColor: "#efe8df",
  width: "device-width",
  initialScale: 1,
  // Запрещаем zoom: на mobile-PWA это снижает случайные тапы.
  // При необходимости снимем после теста на пилоте.
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${spectral.variable} ${golos.variable} antialiased`}
    >
      <body className="min-h-dvh flex flex-col">
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
