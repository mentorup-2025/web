'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function MeetPage() {
  useEffect(() => {
    // Nothing needed here for now
  }, []);

  const handleGoogleLogin = () => {
    // Create token client
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      scope: 'https://www.googleapis.com/auth/calendar',
      callback: async (tokenResponse: any) => {
        console.log('Access Token:', tokenResponse.access_token);

        const res = await fetch('/api/create-meet', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenResponse.access_token}`,
            'Content-Type': 'application/json'
          },
        });

        const data = await res.json();
        alert(`Your Meet Link: ${data.meetLink}`);
      },
    });

    tokenClient.requestAccessToken();
  };

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="beforeInteractive"
      />
      <button onClick={handleGoogleLogin}>Generate Google Meet</button>
    </>
  );
}