import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/providers";

export const metadata: Metadata = {
  title: "Survival Terminal",
  description: "Solana prediction royale — survive or be eliminated",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased bg-iron-grey-900 text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
