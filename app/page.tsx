'use client'
import Head from 'next/head'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Link from 'next/link'
import { Switch } from 'antd'
import MarqueeSection from './MarqueeSection'
import styles from './styles/features.module.css'

export default function Home() {
  const { t, i18n } = useTranslation('common')

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'zh' : 'en'
    i18n.changeLanguage(nextLang)
  }

  return (
    <>
      <Head>
        <title>{t('pageTitle')}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={t('pageDescription')} />
      </Head>

      <main className="min-h-screen bg-gradient-to-b flex flex-col items-center justify-center p-6">
        <header className="w-full text-gray-700 flex justify-between items-center py-4 px-4 mx-auto z-10">
          <div>
            <span className="text-2xl font-bold">MentorUp</span>
            <span className="text-xl"> {t('Our Mentors')}</span>
          </div>
          <nav className="space-x-4 hidden md:flex">
            <div className="flex items-center space-x-2">
              <Switch
                checked={i18n.language === 'zh'}
                onChange={toggleLanguage}
              />
              <span>{i18n.language === 'zh' ? '中文' : 'Eng'}</span>
            </div>
            <Link
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
              href=""
            >
              {t('Become a Mentor')}
            </Link>
            <Link
              className="px-6 py-2 bg-white text-gray rounded-md transition"
              href=""
            >
              {t('Log In')}
            </Link>
          </nav>
        </header>
        <section className="relative flex flex-col justify-between h-screen overflow-hidden bg-white">
          <div className="flex flex-col justify-center items-center flex-1 px-4 md:px-0 text-center z-10">
            <h1 className="text-blue-600 text-4xl md:text-6xl font-bold mb-4">
              {t('Learn from the Best.')}
            </h1>
            <h2 className="text-black text-2xl md:text-4xl font-bold">
              {t('A Marketplace for Career Insights')}
            </h2>
            <h2 className="text-black text-2xl md:text-4xl font-bold mb-4">
              {t('& Mentorship in STEM.')}
            </h2>
            <p className="text-gray-600 text-lg md:text-xl mb-6 max-w-2xl">
              {t(
                'Connect with experienced professionals and accelerate your career.'
              )}
            </p>
            <Link
              className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
              href=""
            >
              {t('Meet Our Mentors')}
            </Link>
          </div>
        </section>
      
        {/* blue circle background  */}
        <div className={styles.backgroundCircle}></div>

        <MarqueeSection />

        <section className="w-full max-w-6xl mt-20 px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-black text-center mb-12">
            {t('Why Choose Us')}
          </h2>

          <div className="bg-white rounded-l border border-gray-200 flex flex-col md:flex-row overflow-hidden">
            <div className="md:w-1/2 w-full p-8 flex flex-col justify-center">
              <h3 className="text-lg text-black font-semibold">
                {t('Transform Your Potential With Personalized Support')}
              </h3>
              <h3 className="text-lg text-blue-500 font-semibold mb-8">
                {t('Personalized Support')}
              </h3>
              <p className="text-gray-600 text-base mb-6">
                {t(
                  'This is a descriptive paragraph explaining why our platform is the best choice for mentorship and career growth.'
                )}
              </p>
              <ul className="grid grid-cols-2 gap-y-3 gap-x-6 mb-6 text-black">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  {t('1v1 Coaching')}
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  {t('Forum Q&A')}
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  {t('Professional Career')}
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  {t('Office Hour')}
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  {t('Advice for Every Step')}
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>

                  {t('Exclusive Educationa')}
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  {t('AI Resume Review')}
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 mr-3"></span>
                  {t('Content')}
                </li>
              </ul>

              <Link
                className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition w-max"
                href=""
              >
                {t('Meet Our Mentors')}
              </Link>
            </div>
            <div className="md:w-1/2 w-full h-64 md:h-auto">
              <img
                src="/app/public/landing.png"
                alt="Feature"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        <section
          id="features"
          className={styles.featuresGrid}
        >
          <div className={styles.featureCard}>
            <h2 className={styles.featureTitle}>
              {t('Discover What Skills Your Dream Job Requires ')}
            </h2>
            <p className={styles.featureDescription}>
              {t(
                'MentorUp uses specialized AI to connect you with mentors, offering tailored industry expertise and personalized alignment to help you achieve your career goals.'
              )}
            </p>
          </div>
          <div className={styles.featureCard}>
            <h2 className={styles.featureTitle}>
              {t('Flexible Meetups, Your Way—Quick or In-Depth')}
            </h2>
            <p className={styles.featureDescription}>
              {t(
                'Whether you want to get to know the mentors first or just have a few questions for now, you can access exclusive advice or have more in-depth discussions in real time.'
              )}
            </p>
          </div>
          <div className={styles.featureCard}>
            <h2 className={styles.featureTitle}>
              {t('Connect with Other Members in the Community')}
            </h2>
            <p className={styles.featureDescription}>
              {t(
                'Check our forum where members can participate in discussions. This is a space for knowledge sharing and networking among members worldwide.'
              )}
            </p>
          </div>
        </section>
        <div></div>

        <footer className="bg-blue-100 w-full px-6 py-12 mt-10">
          <div className="max-w-5xl mx-auto flex flex-col space-y-6">
            {/* 左上：黑色文字 */}
            <h3 className="text-black">{t('MentorUp')}</h3>

            {/* 中间：蓝色大字体 */}
            <h2 className="text-blue-500 text-3xl md:text-4xl font-bold">
              {t('Ready to Accelerate Your Career? ')}
            </h2>

            {/* 按钮 */}
            <Link
              href=""
              className="w-fit px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
            >
              {t('Meet Our Mentors')}
            </Link>
            <p className="text-gray-500 text-sm mt-8">
              ©2025 MentorUp contactemail@mentorup.com.
            </p>
          </div>
        </footer>
      </main>
    </>
  )
}
