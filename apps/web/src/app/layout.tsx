import type { Metadata } from "next";
import "./globals.css";
import { WebSocketProvider } from "@web/components/WebSocketProvider";

export const metadata: Metadata = {
  title: "VedaAI Assessment Creator",
  description: "AI-assisted assignment and exam paper creator for teachers.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <WebSocketProvider>{children}</WebSocketProvider>
      </body>
    </html>
  );
}

