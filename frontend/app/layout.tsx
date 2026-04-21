import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Selorah Health",
  description: "Securing Health Records from Patient to Provider",
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.png', 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
