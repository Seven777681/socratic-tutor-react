import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Socratic AI Programming Tutor - Login",
  description: "Guided programming practice with Socratic AI support",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
