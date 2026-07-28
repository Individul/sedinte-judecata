import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Evidența ședințelor de judecată",
  description:
    "Registru zilnic al ședințelor de judecată, cu rapoarte pe zi, săptămână, lună, trimestru, semestru și an.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ro" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
