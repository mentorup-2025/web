import 'antd/dist/reset.css';
import type { AppProps } from 'next/app'

const App = ({ Component, pageProps }: AppProps) => {
  return <Component {...pageProps} />
}

// Explicitly set the default export
export default App 