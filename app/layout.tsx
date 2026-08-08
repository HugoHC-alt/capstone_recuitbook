import type { Metadata } from 'next';
import { Space_Grotesk, Fraunces } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-grotesk' });
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300'],
  style: ['normal'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'RecruitBook',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
