import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Hub Pro — Info Jeunes PDL",
  description: "Plateforme professionnelle du Réseau Info Jeunes Pays de la Loire",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-9999 focus:px-4 focus:py-2 focus:bg-teal-700 focus:text-white focus:rounded-md focus:text-sm"
        >
          Aller au contenu principal
        </a>
        {children}
      </body>
    </html>
  )
}
