import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';  // ← 必须从 server 取
import { GoogleAnalytics } from '@next/third-parties/google';

import "../styles/index.css";
import '../styles/globals.css';

import ChatWidget from "@/components/ChatWidget";
import GlobalPromoBanner from '@/components/GlobalPromoBanner';
import FooterClient from "@/components/FooterClient";
import TimezoneSyncProvider from '@/components/TimezoneSyncProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'MentorUp',
    description: 'Grow together with MentorUP — where mentors and mentees find their perfect match to learn, share, and succeed.',
};

// ❗ RootLayout 必须是 async 才能 await currentUser()
export default async function RootLayout({ children }: { children: React.ReactNode }) {

    let userId: string | null = null;

    const user = await currentUser().catch(() => null);
    if (user) userId = user.id;

    return (
        <ClerkProvider>
            <html lang="en">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </head>
            <body className={inter.className}>
            <GlobalPromoBanner />

            {/* 🔥 自动时区同步只在前端运行 */}
            <TimezoneSyncProvider userId={userId} />

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