import type { Metadata } from "next";

import Script from "next/script";

// import { Geist, Geist_Mono } from "next/font/google";
// import { Open_Sans } from 'next/font/google';
import { Albert_Sans } from "next/font/google";
import "./css/globals.css";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { CleanUrlHandler } from "@/app/(client)/auth/components/CleanUrlHandler";

import { AuthProvider } from "@/providers/AuthProvider";
import { DataProvider } from "@/providers/DataProvider";
import { ItemProvider } from "@/providers/ItemProvider";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { getItemsSaved } from "./(client)/properties/controller/properties-controller";

// Configuramos la fuente
const albertSans = Albert_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
  preload: false,
});

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
//   preload: false,
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
//   preload: false,
// });

export const metadata: Metadata = {
  title: "RBE Real Estate | Find Your Dream Property",
  description:
    "Top Real Estate SaaS in Spain. Buy or sell properties in Portugal, France & UK. The best platform for private owners and professional agents. Find or List your home now!",
  keywords: [
    "Real Estate SaaS",
    "Property Search",
    "Multi-user Real Estate Platform",
    "Real Estate Listings",
    "Luxury Homes for Sale",
    "Property Management Software",
    "Real Estate Analytics",
    "Real Estate SaaS Europe",
    "For sale by owner Spain",
    "Property listings Portugal",
    "Real estate agents tools",
    "International property portal UK",
    "MLS listings France",
    "Sell property fast Spain",
    "Luxury real estate marketing",
    "Property management software for agents",
    "Investment properties Southern Europe",
  ],
  authors: [{ name: "RBE Team" }],
  // Configuración para que se vea bien al compartir en redes (LinkedIn, X, WhatsApp)
  openGraph: {
    title: "RBE Real Estate - Professional Property Search Platform",
    description:
      "Search your next home or manage your property portfolio with our advanced SaaS solution.",
    type: "website",
    locale: "en_US",
    url: "https://rbe.com",
    siteName: "RBE Real Estate",
  },
  // Configuración para robots de búsqueda
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({ headers: await headers() });
  const itemsSaved = session ? await getItemsSaved() : [];

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Usamos el Script con src apuntando a public/theme.js */}
        <Script src="/theme.js" strategy="beforeInteractive" />
      </head>
      <body
        className={`${albertSans.className} antialiased`} // ${geistSans.variable} ${geistMono.variable}
      >
        <AuthProvider userSession={session}>
          <DataProvider>
            <ItemProvider initialItemsSaved={itemsSaved}>
              <CleanUrlHandler />{" "}
              {/* LIMPIAMOS LA URL UTILIZADA POR EL PROXI.TS QUE ASEGURA QUE NO QUEDE ABIERTA UNA SESION ANTERIOR EN EL NAVEGADOR */}
              <Navigation />
              {children}
              <Footer session={session} />
            </ItemProvider>
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
