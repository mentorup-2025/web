import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { GoogleAnalytics } from '@next/third-parties/google';
import "../styles/index.css";
import '../styles/globals.css';
import ChatWidget from "@/components/ChatWidget";
import GlobalPromoBanner from '@/components/GlobalPromoBanner';   // ← NEW
import FooterClient from "@/components/FooterClient";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'MentorUp',
    description: 'Grow together with MentorUP — where mentors and mentees find their perfect match to learn, share, and succeed.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <ClerkProvider>
            <html lang="en">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </head>
            <body className={inter.className}>
            {/* 全局 Banner */}
            <GlobalPromoBanner />

            {/* 给主体加上与 Banner 同高的 padding-top（约 48px，可按需微调） */}
            <main>
                <noscript>
                    <iframe
                        src="https://www.googletagmanager.com/ns.html?id=GTM-TMNDDXXB"
                        height="0"
                        width="0"
                        style={{ display: 'none', visibility: 'hidden' }}
                    />
                </noscript>

                {children}
                <ChatWidget />
                <FooterClient />
            </main>

            <GoogleAnalytics gaId="G-1H558DKVKE" />
            </body>
            </html>
        </ClerkProvider>
    );
}
