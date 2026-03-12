import type { Metadata } from "next";
import { Noto_Sans_KR, Source_Code_Pro, Space_Grotesk } from "next/font/google";
import { QaPageShell } from "./components/qa/qa-page-shell";
import "./globals.css";

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
    <html lang="ko">
      <body
        className={`${notoSansKr.variable} ${sourceCodePro.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <QaPageShell includeBottomGlow>
          <h1 className="font-brand text-[38px] font-semibold tracking-[0.25em] text-transparent [text-shadow:0_0_34px_rgba(99,235,255,0.28)] bg-[linear-gradient(110deg,#dcf8ff_0%,#99ecff_38%,#8de5ff_62%,#f8fdff_100%)] bg-clip-text sm:text-[48px]">
            SNIFF
          </h1>
          {children}
        </QaPageShell>
      </body>
    </html>
  );
}
