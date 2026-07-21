import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MomFlow — The kitchen OS for Indian households",
  description:
    "Set your family's dietary rules once. Your cook gets a clear, personalised brief every morning via WhatsApp — in Hindi, Marathi, and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-text-primary antialiased">{children}</body>
    </html>
  );
}
