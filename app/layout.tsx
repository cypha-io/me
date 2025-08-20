import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cypha-io.me"), // Replace with your actual domain
  title: {
    default: "Chamba Nanang - Software Engineer",
    template: `%s | Chamba Nanang`,
  },
  description:
    "Personal portfolio of Chamba Nanang, a passionate software engineer specializing in building modern web applications with React, Next.js, and TypeScript.",
  keywords: [
    "Chamba Nanang",
    "Software Engineer",
    "Full-Stack Developer",
    "Frontend Developer",
    "React Developer",
    "Next.js",
    "TypeScript",
    "Portfolio",
    "Tech Enthusiast",
  ],
  authors: [{ name: "Chamba Nanang", url: "https://cypha-io.me" }],
  creator: "Chamba Nanang",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Chamba Nanang - Software Engineer",
    description:
      "Explore the portfolio of Chamba Nanang, a software engineer creating innovative and user-friendly web experiences.",
    url: "https://cypha-io.me",
    siteName: "Chamba Nanang Portfolio",
    images: [
      {
        url: "/profile.png", // Make sure this path is correct and the image is in /public
        width: 150,
        height: 150,
        alt: "Chamba Nanang's Profile Picture",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chamba Nanang - Software Engineer",
    description:
      "Check out my portfolio! I build modern, responsive, and performant web applications.",
    creator: "@1chambananang", // Replace with your Twitter handle
    images: ["/profile.png"], // Make sure this path is correct
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
