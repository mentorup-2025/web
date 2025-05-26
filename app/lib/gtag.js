export const GA_TRACKING_ID = 'G-1H558DKVKE';

// Track pageviews
export const pageview = (url) => {
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  });
};