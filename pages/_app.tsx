import 'antd/dist/reset.css'
import type { AppProps } from 'next/app'
import Script from 'next/script';
import { appWithTranslation } from 'next-i18next'

import * as gtag from '../app/lib/gtag';

const GA_TRACKING_ID = gtag.GA_TRACKING_ID;

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      {/* GA Script */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_TRACKING_ID}', {
            page_path: window.location.pathname,
          });
        `,
        }}
      />
      <Component {...pageProps} />
    </>
  );
}

// Explicitly set the default export
export default appWithTranslation(App)
