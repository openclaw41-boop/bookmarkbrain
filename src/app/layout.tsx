import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BookmarkBrain — AI reads your bookmarks so you don't have to",
  description: "Stop saving bookmarks you'll never read. BookmarkBrain uses AI to summarize, categorize, and surface what matters from your saved links.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
