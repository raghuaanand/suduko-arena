import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/contexts/AppContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sudoku Arena - Multiplayer Sudoku Platform",
  description: "Play Sudoku against AI or compete with other players in real-time matches. Win prizes in paid competitions!",
  keywords: ["sudoku", "puzzle", "multiplayer", "competition", "online game"],
  authors: [{ name: "Sudoku Arena Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-full bg-background text-foreground antialiased`}
      >
        <AppProvider>
          <div className="flex min-h-screen flex-col">
            {children}
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
