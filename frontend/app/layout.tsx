import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Twitch Chat Tracker",
  description: "Live most common words per Twitch channel",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

