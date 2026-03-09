import "@/styles/globals.css";
import "@/styles/globals.scss";

import { Geist, Geist_Mono } from "next/font/google";
import type { AppProps } from "next/app";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

type PagePropsWithSession = {
  session?: Session | null;
};

export default function App({
  Component,
  pageProps,
}: AppProps<PagePropsWithSession>) {
  const { session, ...restPageProps } = pageProps;

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    async function loadReactGrabCodexProvider() {
      await import("react-grab");
      await import("@react-grab/codex/client");
    }

    void loadReactGrabCodexProvider();
  }, []);

  return (
    <SessionProvider session={session}>
      <div className={`${geistSans.variable} ${geistMono.variable}`}>
        <Component {...restPageProps} />
      </div>
    </SessionProvider>
  );
}
