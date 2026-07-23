import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MomFlow — The kitchen OS for Indian households",
  description:
    "Set your family's dietary rules once. Your cook gets a clear, personalised brief every morning via WhatsApp — in Hindi, Marathi, and more.",
};

// Without this, mobile browsers render the page at desktop width (~980px) and
// scale it down to fit — everything looks tiny and needs pinch-zooming. This
// forces the intended mobile-width rendering on phones (the app's actual target
// device, per the design being a "mobile app shell").
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-text-primary antialiased">{children}</body>
    </html>
  );
}
