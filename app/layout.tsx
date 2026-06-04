import './globals.css';
import { KeepAlive } from '@/components/KeepAlive';

export const metadata = {
  title: 'Billiard Score',
  description: 'Billiard score tracker for you and your friends',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Billiard',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-dvh bg-felt-900 safe-top safe-bottom safe-left safe-right">
        <KeepAlive />
        {children}
      </body>
    </html>
  );
}
