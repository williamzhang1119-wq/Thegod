import { Baloo_2, Nunito } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

const display = Baloo_2({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

const body = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Venture 1",
  description:
    "The homework helper that never gives the answer first — kid-safe Socratic tutoring with hints, coach buttons, and mastery tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} antialiased`}>{children}</body>
    </html>
  );
}
