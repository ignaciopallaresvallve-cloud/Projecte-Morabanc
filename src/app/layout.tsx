import type { Metadata, Viewport } from "next";
import { Source_Sans_3, Manrope } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/components/cart/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { SpecialRequestModal } from "@/components/cart/SpecialRequestModal";
import { PurchaseCommitmentModal } from "@/components/cart/PurchaseCommitmentModal";
import { BuyerInfoModal } from "@/components/cart/BuyerInfoModal";
import { CheckoutModal } from "@/components/cart/CheckoutModal";
import { Toaster } from "@/components/ui/toast";
import { siteConfig } from "@/lib/constants";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-heading-brand",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    locale: "ca_ES",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#114274",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ca"
      className={`${sourceSans.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-surface font-sans text-text">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Vés al contingut
        </a>
        <CartProvider>
          <Header />
          <main id="main-content" className="flex flex-1 flex-col">
            {children}
          </main>
          <Footer />
          <CartDrawer />
          <SpecialRequestModal />
          <PurchaseCommitmentModal />
          <BuyerInfoModal />
          <CheckoutModal />
        </CartProvider>
        <Toaster />
      </body>
    </html>
  );
}
