import type { Metadata } from "next";
import { Noto_Sans_KR, Source_Code_Pro, Space_Grotesk } from "next/font/google";
import { QaPageShell } from "./components/qa/qa-page-shell";
import "./globals.css";
import Link from "next/link";
import { ThemeProvider } from "./theme-provider";
import { ThemeToggle } from "./components/theme-toggle";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-main",
  subsets: ["latin"],
  display: "swap",
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-code",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-logo",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sniff QA Manager",
  description: "Internal QA management tool for Gherkin feature scenarios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${notoSansKr.variable} ${sourceCodePro.variable} ${spaceGrotesk.variable} antialiased transition-colors duration-200`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <QaPageShell includeBottomGlow>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h1
                  className="font-brand text-[38px] font-semibold tracking-[0.25em] text-transparent 
                  [text-shadow:0_0_24px_rgba(37,99,235,0.2)] 
                  bg-[linear-gradient(110deg,#0ea5e9_0%,#3b82f6_38%,#2563eb_62%,#1d4ed8_100%)] 
                  dark:[text-shadow:0_0_34px_rgba(99,235,255,0.28)] 
                  dark:bg-[linear-gradient(110deg,#dcf8ff_0%,#99ecff_38%,#8de5ff_62%,#f8fdff_100%)] 
                  bg-clip-text sm:text-[48px]"
                >
                  <Link href="/">SNIFF</Link>
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-500 dark:text-slate-300">
                  Internal QA management tool for Gherkin feature scenarios
                </p>
              </div>
              <ThemeToggle />
            </div>
            {children}
          </QaPageShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
