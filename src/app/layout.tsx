import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SocketProvider } from "@/contexts/SocketContext";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
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
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-full bg-background text-foreground antialiased`}
      >
        <AuthProvider>
          <AppProvider>
            <SocketProvider>
              <div className="flex min-h-screen flex-col">
                {children}
              </div>
            </SocketProvider>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
