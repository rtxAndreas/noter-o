import type { Metadata, Viewport } from "next";
import { SerwistProvider } from "@serwist/turbopack/react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"),
  title: "Noter-O",
  description:
    "Bloc-notes calculatrice intelligent — Calculez vos opérations en un clin d'œil.",
  applicationName: "Noter-O",
  authors: [{ name: "A-Andreas" }],
  creator: "A-Andreas",
  publisher: "A-Andreas",
  other: {
    copyright: "Copyright © 2026 A-Andreas. Tous droits réservés.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Noter-O",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Noter-O",
    description:
      "Bloc-notes calculatrice intelligent pour vos opérations quotidiennes.",
    type: "website",
    siteName: "Noter-O",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

const darkModeScript = `
(function(){
  try {
    var t = localStorage.getItem('noteo-theme');
    var d = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (d) document.documentElement.classList.add('dark');
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: darkModeScript }} />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <noscript>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "100vh",
              padding: "2rem",
              fontFamily: "system-ui, sans-serif",
              textAlign: "center",
            }}
          >
            <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
              Noter-O nécessite JavaScript
            </h1>
            <p style={{ color: "#71717a" }}>
              Veuillez activer JavaScript dans votre navigateur pour utiliser
              cette application.
            </p>
          </div>
        </noscript>
      </head>
      <body className="min-h-full flex flex-col">
        <SerwistProvider swUrl="/serwist/sw.js">
          {children}
        </SerwistProvider>
      </body>
    </html>
  );
}
