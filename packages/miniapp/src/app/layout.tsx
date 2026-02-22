import type { Metadata } from "next";
import { Providers } from "./providers";
import { FhenixProvider } from "./fhenix-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Base Chat",
  description: "Private messenger on Base",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <Providers>
          <FhenixProvider>
            {children}
          </FhenixProvider>
        </Providers>
      </body>
    </html>
  );
}