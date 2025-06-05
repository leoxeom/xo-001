import './globals.css';
import { Inter, Roboto_Mono } from 'next/font/google';
import { Metadata, Viewport } from 'next';
import { Providers } from './providers';

// Configuration des polices
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

// Métadonnées de l'application
export const metadata: Metadata = {
  title: {
    default: 'PLANNER Suite',
    template: '%s | PLANNER Suite',
  },
  description: 'Suite modulaire de planification pour différents secteurs d\'activité',
  keywords: ['planification', 'événements', 'spectacles', 'festivals', 'équipes techniques', 'planning'],
  authors: [{ name: 'David Marchand' }],
  creator: 'David Marchand',
  publisher: 'PLANNER Suite',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.png' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://planner-suite.app',
    title: 'PLANNER Suite',
    description: 'Suite modulaire de planification pour différents secteurs d\'activité',
    siteName: 'PLANNER Suite',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PLANNER Suite',
      },
    ],
  },
};

// Configuration du viewport
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0F0F1A' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${robotoMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-white antialiased">
        <Providers>
          {/* Effet de fond avec gradient animé */}
          <div className="fixed inset-0 -z-10 bg-gradient-dark animate-gradient" />
          
          {/* Overlay pour les effets de particules/lumière */}
          <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-900/20 via-background/0 to-background/0" />
          
          {/* Container principal */}
          <div className="relative z-0 flex min-h-screen flex-col">
            {children}
          </div>
          
          {/* Portail pour les modals, popovers, etc. */}
          <div id="modal-root" />
        </Providers>
      </body>
    </html>
  );
}
