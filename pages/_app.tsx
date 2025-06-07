import 'antd/dist/reset.css'
import type { AppProps } from 'next/app'
import Script from 'next/script';
import { appWithTranslation } from 'next-i18next'


const App = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <Component {...pageProps} />
    </>
  );
}

// Explicitly set the default export
export default appWithTranslation(App)
