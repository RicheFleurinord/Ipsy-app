import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { BottomNav, HelpButton, PrefsSync, SiteFooter, SiteHeader } from "@/components/Shell";

export const metadata: Metadata = {
  title: "IPsy — Écouter. Comprendre. Soutenir.",
  description:
    "IPsy, assistant haïtien de soutien émotionnel par intelligence artificielle, en français et en kreyòl ayisyen.",
};

export const viewport: Viewport = {
  themeColor: "#0b1b3a",
  width: "device-width",
  initialScale: 1,
};

// Applique la langue et le thème avant le premier rendu pour éviter un flash.
const prefsScript = `try{var t=JSON.parse(localStorage.getItem('ipsy.theme')||'"light"');if(t==='dark')document.documentElement.classList.add('dark');var l=JSON.parse(localStorage.getItem('ipsy.lang')||'"fr"');document.documentElement.lang=l==='ht'?'ht':'fr';}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" suppressHydrationWarning className="h-full">
      <head>
        <script dangerouslySetInnerHTML={{ __html: prefsScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <PrefsSync />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <HelpButton />
        <BottomNav />
      </body>
    </html>
  );
}
