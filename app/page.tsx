'use client'
import { useState, useEffect, useRef } from 'react'

import { SignedIn, SignedOut, SignInButton, SignUpButton, useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button, Space, Drawer, Collapse } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import Head from 'next/head'
import Link from 'next/link'
import { Switch } from 'antd'
import MarqueeSection from './MarqueeSection'
import styles from './styles/features.module.css'
import { useMentorStatus } from './hooks/useMentorStatus';

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
    'Transform Your Potential With Personalized Support': 'Transform Your Potential With ',
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
    'Ready to Accelerate Your Career? ': 'Ready to Accelerate Your Career?',
    'We Offer': 'We Offer',
    'More Features Coming': 'More Features Coming',
    'Meet Our Mentors!': 'Meet Our Mentors!',
    'Meet all mentors': 'Meet all mentors',
    'Affordable Mentorship, Proven Job Outcomes': 'Affordable Mentorship, Proven Job Outcomes',
    'Per Mentor Session': 'Per Mentor Session',
    'See Interview Invitations': 'See Interview Invitations',
    'Job Offers': 'Job Offers',
    'Trusted by 1,300+ Students': 'Trusted by 1,300+ Students',
    'Got Questions?': 'Got Questions?',
    'How do I apply to become a mentor?': 'How do I apply to become a mentor?',
    'What payment methods do you accept?': 'What payment methods do you accept?',
    'How can I update my account details?': 'How can I update my account details?',
    'Who can I contact about orders or appointments?': 'Who can I contact about orders or appointments?',
    'How do I request a refund?': 'How do I request a refund?',
    'faq1': 'To apply as a mentor, please visit the Become a Mentor page and fill out the application form. Our team will review your application and get back to you within 3-5 business days.',
    'faq2': 'Currently, we accept all major credit cards and PayPal. Support for WeChat Pay is coming soon',
    'faq3': 'You can update your account details from your profile page after logging in.',
    'faq4': 'For any order or appointment inquiries, please contact our support team at contactus@mentorup.info.',
    'faq5': 'To request a refund, please visit your order history and click on "Request Refund" next to the relevant order.',
    'Kevin Zhang': 'Kevin Zhang',
    'Senior Software Engineer at Google': 'Senior Software Engineer at Google',
    '8 years': '8 years',
    'Back-end development (Java/K8s), previously at Amazon': 'Back-end development (Java/K8s), previously at Amazon',
    'Linda Chen': 'Linda Chen',
    'Product Designer at Airbnb': 'Product Designer at Airbnb',
    '6 years': '6 years',
    'UI/UX design; CMU grad, interned at IDEO': 'UI/UX design; CMU grad, interned at IDEO',
    'Eric Tan': 'Eric Tan',
    'Data Engineer at Netflix': 'Data Engineer at Netflix',
    '10 years': '10 years',
    'Infrastructure engineering; helped scale systems for millions of users': 'Infrastructure engineering; helped scale systems for millions of users',
    'Yuki - Ohio State University': 'Yuki - Ohio State University',
    'James - SDE': 'James - SDE',
    'No Connection, No Problem': 'No Connection, No Problem',
    'From Layoff to Dream Offer': 'From Layoff to Dream Offer',
    'testimonial1': 'I didn\'t have any network and all my LinkedIn messages went to blackholes. Coach from MentorUp helped me refine my resume, run mock interviews, and map out my career path. I just accepted my dream offer – I couldn\'t be happier!',
    'testimonial2': 'After being laid off, months of rejections left me discouraged. A handful of sessions and mock interviews with MentorUp mentors helped me identify and address my weak points. I now secured my dream position—MentorUp made all the difference.'
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
    'Transform Your Potential With Personalized Support': '通过个性化支持释放',
    'Personalized Support': '您的潜力',
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
    'Ready to Accelerate Your Career? ': '准备好加速您的职业发展了吗？',
    'We Offer': '我们提供',
    'More Features Coming': '更多功能即将上线',
    'Meet Our Mentors!': '认识我们的导师！',
    'Meet all mentors': '查看全部导师',
    'Affordable Mentorship, Proven Job Outcomes': '实惠的导师指导，显著的职业成果',
    'Per Mentor Session': '每次导师会面',
    'See Interview Invitations': '获得面试邀请',
    'Job Offers': '获得工作机会',
    'Trusted by 1,300+ Students': '1300+学员的信赖之选',
    'Got Questions?': '常见问题',
    'How do I apply to become a mentor?': '如何申请成为导师？',
    'What payment methods do you accept?': '支持哪些支付方式？',
    'How can I update my account details?': '如何更新我的账户信息？',
    'Who can I contact about orders or appointments?': '订单或预约相关问题如何联系？',
    'How do I request a refund?': '如何申请退款？',
    'faq1': '如需申请成为导师，请访问"成为导师"页面并填写申请表。我们的团队将在3-5个工作日内审核并回复您。',
    'faq2': '我们支持主流信用卡和 PayPal，微信支付暂未开放，敬请期待。',
    'faq3': '登录后可在个人主页更新账户信息。',
    'faq4': '如有订单或预约相关问题，请联系contactus@mentorup.info。',
    'faq5': '如需申请退款，请在订单历史中点击相关订单旁的"申请退款"按钮。',
    'Kevin Zhang': 'Kevin Zhang',
    'Senior Software Engineer at Google': '谷歌高级软件工程师',
    '8 years': '8年',
    'Back-end development (Java/K8s), previously at Amazon': '后端开发（Java/K8s），曾就职于亚马逊',
    'Linda Chen': 'Linda Chen',
    'Product Designer at Airbnb': 'Airbnb产品设计师',
    '6 years': '6年',
    'UI/UX design; CMU grad, interned at IDEO': 'UI/UX设计，卡内基梅隆毕业，曾在IDEO实习',
    'Eric Tan': 'Eric Tan',
    'Data Engineer at Netflix': 'Netflix数据工程师',
    '10 years': '10年',
    'Infrastructure engineering; helped scale systems for millions of users': '基础设施工程，助力系统扩展至百万级用户',
    'Yuki - Ohio State University': 'Yuki - 俄亥俄州立大学',
    'James - SDE': 'James - SDE',
    'No Connection, No Problem': '无关系也无妨',
    'From Layoff to Dream Offer': '从失业到理想Offer',
    'testimonial1': '我没有任何人脉，领英消息都石沉大海。MentorUp的教练帮我优化简历、模拟面试、规划职业路径。现在我已拿到理想offer，太开心了！',
    'testimonial2': '被裁员后，数月的拒信让我很沮丧。几次导师会面和模拟面试帮我找准弱点并提升。现在我已拿到理想职位——MentorUp真的改变了我。'
  }
}

export default function Home() {
  const [language, setLanguage] = useState<'en' | 'zh'>('en')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user, isSignedIn } = useUser();

  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { isMentor } = useMentorStatus();

  useEffect(() => {
    const checkMentorStatus = async () => {
      if (user?.id) {
        try {
          const response = await fetch(`/api/user/${user.id}`);
          const data = await response.json();
        } catch (error) {
          console.error('Error checking mentor status:', error);
        }
      }
    };

    checkMentorStatus();
  }, [user?.id]);

  // Custom translation function that mimics useTranslation from next-i18next
  const t = (key: string) => {
    return translations[language][key as keyof typeof translations[typeof language]] || key
  }

  // Mentor slider data (moved inside Home for t access)
  const mentors = [
    {
      name: t('Kevin Zhang'),
      title: t('Senior Software Engineer at Google'),
      experience: t('8 years'),
      price: '$30/hr',
      desc: t('Back-end development (Java/K8s), previously at Amazon'),
      img: '/images/placeholder-avatar.png',
    },
    {
      name: t('Linda Chen'),
      title: t('Product Designer at Airbnb'),
      experience: t('6 years'),
      price: '$30/hr',
      desc: t('UI/UX design; CMU grad, interned at IDEO'),
      img: '/images/placeholder-avatar.png',
    },
    {
      name: t('Eric Tan'),
      title: t('Data Engineer at Netflix'),
      experience: t('10 years'),
      price: '$30/hr',
      desc: t('Infrastructure engineering; helped scale systems for millions of users'),
      img: '/images/placeholder-avatar.png',
    },
    {
      name: t('Kevin Zhang'),
      title: t('Senior Software Engineer at Google'),
      experience: t('8 years'),
      price: '$30/hr',
      desc: t('Back-end development (Java/K8s), previously at Amazon'),
      img: '/images/placeholder-avatar.png',
    },
    {
      name: t('Linda Chen'),
      title: t('Product Designer at Airbnb'),
      experience: t('6 years'),
      price: '$30/hr',
      desc: t('UI/UX design; CMU grad, interned at IDEO'),
      img: '/images/placeholder-avatar.png',
    },
    {
      name: t('Eric Tan'),
      title: t('Data Engineer at Netflix'),
      experience: t('10 years'),
      price: '$30/hr',
      desc: t('Infrastructure engineering; helped scale systems for millions of users'),
      img: '/images/placeholder-avatar.png',
    },
  ];

  // FAQ data (moved inside Home for t access)
  const faqs = [
    {
      q: t('How do I apply to become a mentor?'),
      a: t('faq1'),
    },
    {
      q: t('What payment methods do you accept?'),
      a: t('faq2'),
    },
    {
      q: t('How can I update my account details?'),
      a: t('faq3'),
    },
    {
      q: t('Who can I contact about orders or appointments?'),
      a: t('faq4'),
    },
    {
      q: t('How do I request a refund?'),
      a: t('faq5'),
    },
  ];

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

  // MentorSlider component (updated for 5-in-a-row slider)
  function MentorSlider({ mentors }: { mentors: any[] }) {
    const [startIndex, setStartIndex] = useState(0);
    const visibleCount = 5;
    const total = mentors.length;
    useEffect(() => {
      if (total <= visibleCount) return;
      const timer = setInterval(() => {
        setStartIndex((prev) => (prev + 1) % total);
      }, 3500);
      return () => clearInterval(timer);
    }, [total]);
    // Compute the visible mentors (wrap around if needed)
    const visibleMentors = [];
    for (let i = 0; i < Math.min(visibleCount, total); i++) {
      visibleMentors.push(mentors[(startIndex + i) % total]);
    }
    return (
      <div className="flex justify-center items-center gap-6 w-full">
        {visibleMentors.map((mentor, idx) => (
          <div key={mentor.name + idx} className="bg-white border rounded-lg shadow p-6 flex flex-col items-center w-60 transition-all duration-500">
            <img src={mentor.img} alt={mentor.name} className="w-24 h-24 rounded-full object-cover mb-4" />
            <div className="font-bold text-lg mb-1">{mentor.name}</div>
            <div className={`text-gray-600 mb-1 ${styles.mentorTitle}`}>{mentor.title}</div>
            <div className="text-gray-500 text-sm mb-1">{mentor.experience}</div>
            <div className="text-blue-500 font-semibold mb-2">{mentor.price}</div>
            <div className={`text-gray-700 text-sm text-center  ${styles.mentorDescription}`}>{mentor.desc}</div>
          </div>
        ))}
      </div>
    );
  }

  const handleBecomeMentor = () => {
    router.push('/signup/mentor/' + user?.id);
  };

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
          <div className="flex items-center">
            {/* Desktop Menu */}
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
                <SignUpButton mode="modal">
                    <Button type="primary">Become a Mentor/Mentee</Button>
                  </SignUpButton>
                  {' '}
                  <SignInButton mode="modal">
                    <Button type="default">Login</Button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isMentor === false && (
                      <Button 
                        type="primary" 
                        onClick={handleBecomeMentor}
                      >
                        Become a Mentor
                      </Button>
                    )}
                    {isSignedIn && (
                      <div className="relative" ref={dropdownRef}>
                        <button
                          onClick={() => setOpen((o) => !o)}
                          className="flex items-center space-x-2 focus:outline-none"
                        >
                          <img
                            src={user.imageUrl}
                            alt="User"
                            className="w-8 h-8 rounded-full"
                          />
                          <span>{user.firstName}</span>
                        </button>
                        {open && (
                          <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50">
                            <a href={`/mentee-profile/${user.id}`} className="block px-4 py-2 hover:bg-gray-100">Mentee Profile</a>
                            {isMentor && <a href={`/mentor-profile/${user.id}`} className="block px-4 py-2 hover:bg-gray-100">Mentor Profile</a>}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                signOut();
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                            >
                              Sign out
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </SignedIn>
              </Space>
            </nav>

            {/* Mobile Menu Button */}
            <Button 
              type="text" 
              icon={<MenuOutlined />} 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
            />

            {/* Mobile Menu Drawer */}
            <Drawer
              title="Menu"
              placement="right"
              onClose={() => setMobileMenuOpen(false)}
              open={mobileMenuOpen}
              className="md:hidden"
            >
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <Switch
                    checked={i18n.language === 'zh'}
                    onChange={toggleLanguage}
                  />
                  <span>{i18n.language === 'zh' ? '中文' : 'Eng'}</span>
                </div>
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button type="text" block>Login</Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button type="primary" block>Sign Up</Button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexDirection: 'column' }}>
                    {isMentor === false && (
                      <Button 
                        type="primary" 
                        onClick={handleBecomeMentor}
                      >
                        Become a Mentor
                      </Button>
                    )}
                    {isSignedIn && (
                      <div className="relative" ref={dropdownRef}>
                        <button
                          onClick={() => setOpen((o) => !o)}
                          className="flex items-center space-x-2 focus:outline-none"
                        >
                          <img
                            src={user.imageUrl}
                            alt="User"
                            className="w-8 h-8 rounded-full"
                          />
                          <span>{user.firstName}</span>
                        </button>
                        {open && (
                          <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50">
                            <a href={`/mentee-profile/${user.id}`} className="block px-4 py-2 hover:bg-gray-100">Mentee Profile</a>
                            {isMentor && <a href={`/mentor-profile/${user.id}`} className="block px-4 py-2 hover:bg-gray-100">Mentor Profile</a>}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                signOut();
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                            >
                              Sign out
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </SignedIn>
              </div>
            </Drawer>
          </div>
        </header>
        <section className={`relative flex flex-col justify-between h-screen overflow-hidden bg-white ${styles.heroContainer}`}>
          <div className={`flex flex-col justify-center items-center flex-1 px-4 md:px-0 text-center z-10`}>
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
              href="/mentor-list"
            >
              {t('Meet Our Mentors')}
            </Link>
          </div>
        </section>
      
        {/* blue circle background  */}
        <div className={styles.backgroundCircle}></div>

        <MarqueeSection />

        {/* --- Start max-width wrapper --- */}
        <div className="w-full max-w-6xl mx-auto px-4">
        {/* 1. HERO SECTION WITH VIDEO PLACEHOLDER */}
        <section className="w-full items-center justify-between py-12 gap-8">
          <div className="px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-black mb-2">
              {t('Transform Your Potential With Personalized Support')}
              <span className="text-blue-500 font-semibold mb-4 text-blue">
                {t('Personalized Support')}
              </span>
            </h2>
          </div>
          <div className={styles.videoContentWrapper}>
            <div className={`flex-1 flex items-center justify-center ${styles.videoContent}`}>
              {/* Video placeholder */}
              <div className="w-full h-full  bg-gray-200 rounded-lg flex items-center justify-center">
                <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-400">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <polygon points="10,8 16,12 10,16" fill="currentColor" />
                </svg>
              </div>
            </div>
            <div className="h-full bg-white border rounded-lg p-4">
              <div className="text-black font-bold mb-2">{t('We Offer')}:</div>
              <div className="text-blue-600 underline">{t('1v1 Coaching')}</div>
              <div className="text-blue-600 underline">{t('Professional Career')}</div>
              <div className="font-bold mt-4 mb-2">{t('More Features Coming')}:</div>
              <ul className="text-gray-700 text-sm list-disc ml-5">
                <li>{t('Advice for Every Step')}</li>
                <li>{t('AI Resume Review')}</li>
                <li>{t('Forum Q&A')}</li>
                <li>{t('Office Hour')}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 2. MEET OUR MENTORS SLIDER SECTION */}
        <section className="w-full py-12">
          <div className="flex items-center justify-between mb-6 px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-black">
              {t('Meet Our Mentors!')}
            </h2>
            <Link href="/mentor-list">
              <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
                {t('Meet all mentors')}
              </button>
            </Link>
          </div>
          {/* Simple slider implementation */}
          <MentorSlider mentors={mentors} />
        </section>

        {/* 3. AFFORDABLE MENTORSHIP/OUTCOMES SECTION */}
        <section className="w-full py-12 bg-white">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-8">
            {t('Affordable Mentorship, Proven Job Outcomes')}
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 px-4">
            <div className="bg-blue-500 text-white rounded-lg p-8 flex-1 min-w-[220px] text-center">
              <div className="text-3xl font-bold mb-2">$50</div>
              <div className="font-semibold mb-2">{t('Per Mentor Session')}</div>
              <div className={`text-xs ${styles.MentorshipDescription}`}>Book a mentor at a low price<br/>$50–$80/session (save more—get a mentor for only $30)</div>
            </div>
            
            <div className="bg-blue-200 text-blue-900 rounded-lg p-8 flex-1 min-w-[220px] text-center">
              <div className="text-3xl font-bold mb-2">95%</div>
              <div className="font-semibold mb-2">{t('See Interview Invitations')}</div>
              <div className={`text-xs ${styles.MentorshipDescription}`}>Our mentees polish their resume with expert help; 95% receive job interview requests.</div>
            </div>
            <div className="bg-blue-900 text-white rounded-lg p-8 flex-1 min-w-[220px] text-center">
              <div className="text-3xl font-bold mb-2">80%</div>
              <div className="font-semibold mb-2">{t('Job Offers')}</div>
              <div className={`text-xs ${styles.MentorshipDescription}`}>80% of mentees landed offers after company inquiry and our mock interviews to help you land that role.</div>
            </div>
          </div>
        </section>

        {/* TESTIMONIAL SECTION */}
        <section className="w-full py-12 bg-[#f9fbfd]">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-10 px-4 text-center">
            {t('Trusted by 1,300+ Students')}
          </h2>
          <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch px-4">
            {/* Testimonial 1 */}
            <div className="bg-blue-50 rounded-xl p-8 flex-1 min-w-[300px] flex flex-col justify-between shadow-sm">
              <div>
                <h3 className="text-lg font-semibold text-blue-700 mb-2">{t('No Connection, No Problem')}</h3>
                <div className="text-3xl text-black mb-2">“</div>
                <p className="text-gray-800 mb-4">
                  {t('testimonial1')}
                </p>
              </div>
              <div className="flex items-center mt-4">
                <img src="/images/placeholder-avatar.png" alt="Yuki" className="w-10 h-10 rounded-full mr-3 border border-gray-200" />
                <span className="text-gray-600 text-sm">{t('Yuki - Ohio State University')}</span>
              </div>
              <div className="text-3xl text-black text-right mt-2">”</div>
            </div>
            {/* Testimonial 2 */}
            <div className="bg-blue-50 rounded-xl p-8 flex-1 min-w-[300px] flex flex-col justify-between shadow-sm">
              <div>
                <h3 className="text-lg font-semibold text-blue-700 mb-2">{t('From Layoff to Dream Offer')}</h3>
                <div className="text-3xl text-black mb-2">“</div>
                <p className="text-gray-800 mb-4">
                  {t('testimonial2')}
                </p>
              </div>
              <div className="flex items-center mt-4">
                <img src="/images/placeholder-avatar.png" alt="James" className="w-10 h-10 rounded-full mr-3 border border-gray-200" />
                <span className="text-gray-600 text-sm">{t('James - SDE')}</span>
              </div>
              <div className="text-3xl text-black text-right mt-2">”</div>
            </div>
          </div>
        </section>

        {/* 4. FAQ COLLAPSE SECTION */}
        <section className="w-full py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-6 px-4">
            {t('Got Questions?')}
          </h2>
          <div className=" w-full">
            <Collapse accordion>
              {faqs.map((faq, idx) => (
                <Collapse.Panel header={faq.q} key={idx}>
                  <div className="text-gray-700 text-base">{faq.a}</div>
                </Collapse.Panel>
              ))}
            </Collapse>
          </div>
        </section>
        {/* --- End max-width wrapper --- */}
        </div>
      </main>

      <footer className="bg-blue-100 w-full px-6 py-12 mt-10">
          <div className="max-w-5xl mx-auto flex flex-col space-y-6">
            {/* 左上：黑色文字 */}
            <h3 className="text-black">{t('MentorUp')}</h3>

            {/* 中间：蓝色大字体 */}
            <h2 className="text-blue-500 text-3xl md:text-4xl font-bold">
              {t('Ready to Accelerate Your Career? ')}
            </h2>

            <Link
              href="/mentor-list"
              className="w-fit px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
            >
              {t('Meet Our Mentors')}
            </Link>

            <div className={styles.footerCopyright}>
              <p className="text-gray-500 text-sm mt-8">
                ©2025 MentorUp contactus@mentorup.info.
              </p>
                        <p className="text-gray-500 text-sm mt-8 flex justify-center gap-6">
              <a href="/privacy">Privacy Policy & Term of use</a>
            </p>
            </div>
            
          </div>
        </footer>
    </>
  )
}
