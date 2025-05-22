'use client'
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { Button, Space } from 'antd';
import Head from 'next/head'
import Link from 'next/link'
import { Switch } from 'antd'
import MarqueeSection from './MarqueeSection'
import styles from './styles/features.module.css'
import { useState } from 'react'

// Translation object with all your content
const translations = {
  en: {
    pageTitle: 'MentorUp - Learn from the Best',
    pageDescription: 'A marketplace for career insights and mentorship in STEM',
    'Our Mentors': 'Our Mentors',
    'Become a Mentor': 'Become a Mentor',
    'Log In': 'Log In',
    'Learn from the Best.': 'Learn from the Best.',
    'A Marketplace for Career Insights': 'A Marketplace for Career Insights',
    '& Mentorship in STEM.': '& Mentorship in STEM.',
    'Connect with experienced professionals and accelerate your career.': 'Connect with experienced professionals and accelerate your career.',
    'Meet Our Mentors': 'Meet Our Mentors',
    'Why Choose Us': 'Why Choose Us',
    'Transform Your Potential With Personalized Support': 'Transform Your Potential With Personalized Support',
    'Personalized Support': 'Personalized Support',
    'This is a descriptive paragraph explaining why our platform is the best choice for mentorship and career growth.': 'This is a descriptive paragraph explaining why our platform is the best choice for mentorship and career growth.',
    '1v1 Coaching': '1v1 Coaching',
    'Forum Q&A': 'Forum Q&A',
    'Professional Career': 'Professional Career',
    'Office Hour': 'Office Hour',
    'Advice for Every Step': 'Advice for Every Step',
    'Exclusive Education': 'Exclusive Education',
    'AI Resume Review': 'AI Resume Review',
    'Content': 'Content',
    'Discover What Skills Your Dream Job Requires ': 'Discover What Skills Your Dream Job Requires',
    'MentorUp uses specialized AI to connect you with mentors, offering tailored industry expertise and personalized alignment to help you achieve your career goals.': 'MentorUp uses specialized AI to connect you with mentors, offering tailored industry expertise and personalized alignment to help you achieve your career goals.',
    'Flexible Meetups, Your Way—Quick or In-Depth': 'Flexible Meetups, Your Way—Quick or In-Depth',
    'Whether you want to get to know the mentors first or just have a few questions for now, you can access exclusive advice or have more in-depth discussions in real time.': 'Whether you want to get to know the mentors first or just have a few questions for now, you can access exclusive advice or have more in-depth discussions in real time.',
    'Connect with Other Members in the Community': 'Connect with Other Members in the Community',
    'Check our forum where members can participate in discussions. This is a space for knowledge sharing and networking among members worldwide.': 'Check our forum where members can participate in discussions. This is a space for knowledge sharing and networking among members worldwide.',
    'MentorUp': 'MentorUp',
    'Ready to Accelerate Your Career? ': 'Ready to Accelerate Your Career?'
  },
  zh: {
    pageTitle: 'MentorUp - 向最优秀的人学习',
    pageDescription: 'STEM领域职业洞察和导师指导的市场平台',
    'Our Mentors': '我们的导师',
    'Become a Mentor': '成为导师',
    'Log In': '登录',
    'Learn from the Best.': '向最优秀的人学习。',
    'A Marketplace for Career Insights': '职业洞察的市场平台',
    '& Mentorship in STEM.': '及STEM领域的导师指导。',
    'Connect with experienced professionals and accelerate your career.': '与经验丰富的专业人士建立联系，加速您的职业发展。',
    'Meet Our Mentors': '认识我们的导师',
    'Why Choose Us': '为什么选择我们',
    'Transform Your Potential With Personalized Support': '通过个性化支持释放您的潜力',
    'Personalized Support': '个性化支持',
    'This is a descriptive paragraph explaining why our platform is the best choice for mentorship and career growth.': '这是一个描述性段落，解释为什么我们的平台是导师指导和职业发展的最佳选择。',
    '1v1 Coaching': '1对1辅导',
    'Forum Q&A': '论坛问答',
    'Professional Career': '职业发展',
    'Office Hour': '办公时间',
    'Advice for Every Step': '每一步的建议',
    'Exclusive Education': '独家教育',
    'AI Resume Review': 'AI简历评估',
    'Content': '内容',
    'Discover What Skills Your Dream Job Requires ': '发现您梦想工作所需的技能',
    'MentorUp uses specialized AI to connect you with mentors, offering tailored industry expertise and personalized alignment to help you achieve your career goals.': 'MentorUp使用专业的AI将您与导师联系起来，提供量身定制的行业专长和个性化匹配，帮助您实现职业目标。',
    'Flexible Meetups, Your Way—Quick or In-Depth': '灵活的会面方式—快速或深入',
    'Whether you want to get to know the mentors first or just have a few questions for now, you can access exclusive advice or have more in-depth discussions in real time.': '无论您是想先了解导师还是现在只有几个问题，您都可以获得独家建议或进行更深入的实时讨论。',
    'Connect with Other Members in the Community': '与社区其他成员建立联系',
    'Check our forum where members can participate in discussions. This is a space for knowledge sharing and networking among members worldwide.': '查看我们的论坛，成员可以参与讨论。这是全球成员知识分享和网络交流的空间。',
    'MentorUp': 'MentorUp',
    'Ready to Accelerate Your Career? ': '准备好加速您的职业发展了吗？'
  }
}

export default function Home() {
  const [language, setLanguage] = useState<'en' | 'zh'>('en')

  // Custom translation function that mimics useTranslation from next-i18next
  const t = (key: string) => {
    return translations[language][key as keyof typeof translations[typeof language]] || key
  }

  // Custom i18n object that mimics the behavior from next-i18next
  const i18n = {
    language,
    changeLanguage: (newLang: 'en' | 'zh') => {
      setLanguage(newLang)
    }
  }

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
            <Space>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button type="text">Login</Button>
                </SignInButton>
                {' '}
                <SignUpButton mode="modal">
                  <Button type="primary">Sign Up</Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </Space>
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

                  {t('Exclusive Education')}
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
            <div className={`md:w-1/2 w-full h-64 md:h-auto ${styles.landingBg}`}>
              {/* Content can go here if needed */}
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
