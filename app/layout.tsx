import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pdfumo.com"),
  title: {
    default: "PDFumo — Simple PDF Tools Online",
    template: "%s | PDFumo",
  },
  description:
    "Free online PDF tools to compress, merge, split, convert, protect, and watermark PDF files. Fast, simple, and private.",
  applicationName: "PDFumo",
  keywords: [
    "PDF tools",
    "PDF compressor",
    "merge PDF",
    "split PDF",
    "PDF to JPG",
    "JPG to PDF",
    "protect PDF",
    "watermark PDF",
    "online PDF tools",
  ],
  authors: [{ name: "PDFumo" }],
  creator: "PDFumo",
  publisher: "PDFumo",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: "PDFumo",
    title: "PDFumo — Simple PDF Tools Online",
    description:
      "Free online PDF tools to compress, merge, split, convert, protect, and watermark PDF files.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
