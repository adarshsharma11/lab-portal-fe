import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/ui/providers";

export const metadata: Metadata = {
  title: "BLDignostics LIMS",
  description: "Clinical laboratory information system",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full"><Providers>{children}</Providers></body>
    </html>
  );
}
