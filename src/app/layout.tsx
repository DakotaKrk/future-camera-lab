import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Future Camera Lab",
  description: "Interactive 3D camera training for aperture, shutter speed, and ISO."
};

interface RootLayoutProps {
  readonly children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}
