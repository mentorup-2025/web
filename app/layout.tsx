import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { GoogleAnalytics } from '@next/third-parties/google'
import "../styles/index.css";
import '../styles/globals.css';
import ChatWidget from "@/components/ChatWidget";


// todo: complete google analytics
// https://nextjs.org/docs/messages/next-script-for-ga

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'MentorUp',
    description: 'Grow together with MentorUP — where mentors and mentees find their perfect match to learn, share, and succeed.',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <ClerkProvider>
            <html lang="en">
                <head>
                    
                </head>
                <body className={inter.className}>
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
                </body>
                <GoogleAnalytics gaId="G-1H558DKVKE" />
            </html>
        </ClerkProvider>
    );
}