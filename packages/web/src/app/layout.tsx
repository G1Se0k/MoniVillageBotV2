import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getGuildIcon } from "@/lib/guildIcon";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const guild = await getGuildIcon(512);
  const title = "모니마을";
  const description = "모니마을 채팅 꾸미기 샵";
  return {
    title,
    description,
    icons: guild?.url ? { icon: guild.url } : undefined,
    openGraph: {
      title,
      description,
      siteName: title,
      type: "website",
      images: guild?.url ? [guild.url] : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: guild?.url ? [guild.url] : undefined,
    },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative overflow-x-hidden bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-zinc-950 dark:via-black dark:to-orange-950/40">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-300/30 blur-3xl dark:bg-amber-500/20" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-orange-400/30 blur-3xl dark:bg-orange-500/20" />
        </div>
        {children}
      </body>
    </html>
  );
}
