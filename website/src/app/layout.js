import localFont from "next/font/local";
import "./globals.css";

const fraunces = localFont({
  variable: "--font-fraunces",
  display: "swap",
  src: [
    { path: "../../public/fonts/Fraunces-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/Fraunces-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../public/fonts/Fraunces-Bold.ttf", weight: "700", style: "normal" },
  ],
});

const description =
  "Done Loop is a local-first habit, task, calendar, and reminder app with a calm dark design.";

export const metadata = {
  title: "Done Loop - Habits and Tasks in One Quiet Loop",
  description,
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "Done Loop",
    description,
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
