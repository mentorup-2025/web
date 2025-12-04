'use client';
import { useState, useEffect, useRef } from 'react';

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  useUser,
  useClerk
} from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button, Space, Drawer, Collapse } from 'antd';
import { MenuOutlined, SearchOutlined, CaretRightOutlined } from '@ant-design/icons';
import Head from 'next/head';
import Link from 'next/link';
import { Switch } from 'antd';
import MarqueeSection from './MarqueeSection';
import styles from './styles/features.module.css';
import { useMentorStatus } from './hooks/useMentorStatus';
import { Mentor } from "../types";
import { netToGross } from './services/priceHelper';

const translations = {
  en: {
    pageTitle: 'MentorUp - Learn from the Best',
    pageDescription: 'A marketplace for career insights and mentorship in STEM',
    'Our Mentors': 'Our Mentors',
    'Become a Mentor': 'Become a Mentor',
    'Log In': 'Log In',
    '1-on-1 Mentorship with': '1-on-1 Mentorship with: ',
    'A Marketplace for Career Insights': 'A Marketplace for Career Insights',
    '& Mentorship in STEM.': '& Mentorship in STEM.',
    'Connect with experienced professionals and accelerate your career.':
      'Connect with experienced professionals and accelerate your career.',
    'Meet Our Mentors': 'Meet Our Mentors',
    'Why Choose Us': 'Why Choose Us',
    'Transform Your Potential With Personalized Support':
      'Transform Your Potential With ',
    'Personalized Support': 'Personalized Support',
    'This is a descriptive paragraph explaining why our platform is the best choice for mentorship and career growth.':
      'This is a descriptive paragraph explaining why our platform is the best choice for mentorship and career growth.',
    '1v1 Coaching': '1v1 Coaching',
    'Forum Q&A': 'Forum Q&A',
    'Professional Career': 'Professional Career',
    'Office Hour': 'Office Hour',
    'Advice for Every Step': 'Advice for Every Step',
    'Exclusive Education': 'Exclusive Education',
    'AI Resume Review': 'AI Resume Review',
    Content: 'Content',
    'Discover What Skills Your Dream Job Requires ':
      'Discover What Skills Your Dream Job Requires',
    'MentorUp uses specialized AI to connect you with mentors, offering tailored industry expertise and personalized alignment to help you achieve your career goals.':
      'MentorUp uses specialized AI to connect you with mentors, offering tailored industry expertise and personalized alignment to help you achieve your career goals.',
    'Flexible Meetups, Your Way—Quick or In-Depth':
      'Flexible Meetups, Your Way—Quick or In-Depth',
    'Whether you want to get to know the mentors first or just have a few questions for now, you can access exclusive advice or have more in-depth discussions in real time.':
      'Whether you want to get to know the mentors first or just have a few questions for now, you can access exclusive advice or have more in-depth discussions in real time.',
    'Connect with Other Members in the Community':
      'Connect with Other Members in the Community',
    'Check our forum where members can participate in discussions. This is a space for knowledge sharing and networking among members worldwide.':
      'Check our forum where members can participate in discussions. This is a space for knowledge sharing and networking among members worldwide.',
    MentorUp: 'MentorUp',
    'Ready to Accelerate Your Career? ': 'Ready to Accelerate Your Career?',
    'We Offer': 'We Offer',
    'More Features Coming': 'More Features Coming',
    'Meet Our Mentors!': 'Meet Our Mentors!',
    'Meet all mentors': 'Meet all mentors',
    'Affordable Mentorship, Proven Job Outcomes':
      'Affordable Mentorship, Proven Job Outcomes',
    'Per Mentor Session': 'Price per Session',
    'Per Mentor Session description': 'Book a mentor at a low price $50–$80/session (save more—get a mentor for only $30)',
    'See Interview Invitations': 'Satisfaction rate',
    'See Interview Invitations description': 'Book a mentor at a low price $50–$80/session (save more — get a mentor for only $30)',
    'Job Offers': 'Landed on offers after mentorship',
    'Job Offers description': 'Industry average: 20–30%',
    'Trusted by 1,300+ Students': 'Trusted by 1,300+ Students',
    'Got Questions?': 'Got Questions?',
    'How do I apply to become a mentor?': 'How do I apply to become a mentor?',
    'What payment methods do you accept?':
      'What payment methods do you accept?',
    'How can I update my account details?':
      'How can I update my account details?',
    'Who can I contact about orders or appointments?':
      'Who can I contact about orders or appointments?',
    'How do I request a refund?': 'How do I request a refund?',
    faq1: 'To apply as a mentor, please visit the Become a Mentor page and fill out the application form. Our team will review your application and get back to you within 3-5 business days.',
    faq2: 'Currently, we accept all major credit cards and PayPal. Support for WeChat Pay is coming soon',
    faq3: 'You can update your account details from your profile page after logging in.',
    faq4: 'For any order or appointment inquiries, please contact our support team at contactus@mentorup.info.',
    faq5: 'To request a refund, please visit your order history and click on "Request Refund" next to the relevant order.',
    'Kevin Zhang': 'Kevin Zhang',
    'Senior Software Engineer at Google': 'Senior Software Engineer at Google',
    '8 years': '8 years',
    'Back-end development (Java/K8s), previously at Amazon':
      'Back-end development (Java/K8s), previously at Amazon',
    'Linda Chen': 'Linda Chen',
    'Product Designer at Airbnb': 'Product Designer at Airbnb',
    '6 years': '6 years',
    'UI/UX design; CMU grad, interned at IDEO':
      'UI/UX design; CMU grad, interned at IDEO',
    'Eric Tan': 'Eric Tan',
    'Data Engineer at Netflix': 'Data Engineer at Netflix',
    '10 years': '10 years',
    'Infrastructure engineering; helped scale systems for millions of users':
      'Infrastructure engineering; helped scale systems for millions of users',
    'James - Ohio State University': 'James - Ohio State University',
    'Yuki - SDE': 'Yuki - SDE',
    'No Connection, No Problem': 'No Connection, No Problem',
    'From Layoff to Dream Offer': 'From Layoff to Dream Offer',
    testimonial1:
      "I didn't have any network and all my LinkedIn messages went to blackholes. Coach from MentorUp helped me refine my resume, run mock interviews, and map out my career path. I just accepted my dream offer – I couldn't be happier!",
    testimonial2:
      'After being laid off, months of rejections left me discouraged. A handful of sessions and mock interviews with MentorUp mentors helped me identify and address my weak points. I now secured my dream position—MentorUp made all the difference.',
      roles: [
        "Software Engineer",
        "Data Scientist",
        "Machine Learning Engineer",
        "Product Manager",
        "Data Engineer",
        "Data Analyst",
        "Financial Analyst",
        "Quant Analyst",
        "Consultant",
        "UI/UX Designer"
      ]
  },
  zh: {
    pageTitle: 'MentorUp - 向最优秀的人学习',
    pageDescription: 'STEM领域职业洞察和导师指导的市场平台',
    'Our Mentors': '我们的导师',
    'Become a Mentor': '成为导师',
    'Log In': '登录',
    '1-on-1 Mentorship with': '一对一职业辅导',
    'A Marketplace for Career Insights': '职业洞察的市场平台',
    '& Mentorship in STEM.': '及STEM领域的导师指导。',
    'Connect with experienced professionals and accelerate your career.':
      '与经验丰富的专业人士建立联系，加速您的职业发展。',
    'Meet Our Mentors': '认识我们的导师',
    'Why Choose Us': '为什么选择我们',
    'Transform Your Potential With Personalized Support': '通过个性化支持释放',
    'Personalized Support': '您的潜力',
    'This is a descriptive paragraph explaining why our platform is the best choice for mentorship and career growth.':
      '这是一个描述性段落，解释为什么我们的平台是导师指导和职业发展的最佳选择。',
    '1v1 Coaching': '1对1辅导',
    'Forum Q&A': '论坛问答',
    'Professional Career': '职业发展',
    'Office Hour': '办公时间',
    'Advice for Every Step': '每一步的建议',
    'Exclusive Education': '独家教育',
    'AI Resume Review': 'AI简历评估',
    Content: '内容',
    'Discover What Skills Your Dream Job Requires ': '发现您梦想工作所需的技能',
    'MentorUp uses specialized AI to connect you with mentors, offering tailored industry expertise and personalized alignment to help you achieve your career goals.':
      'MentorUp使用专业的AI将您与导师联系起来，提供量身定制的行业专长和个性化匹配，帮助您实现职业目标。',
    'Flexible Meetups, Your Way—Quick or In-Depth': '灵活的会面方式—快速或深入',
    'Whether you want to get to know the mentors first or just have a few questions for now, you can access exclusive advice or have more in-depth discussions in real time.':
      '无论您是想先了解导师还是现在只有几个问题，您都可以获得独家建议或进行更深入的实时讨论。',
    'Connect with Other Members in the Community': '与社区其他成员建立联系',
    'Check our forum where members can participate in discussions. This is a space for knowledge sharing and networking among members worldwide.':
      '查看我们的论坛，成员可以参与讨论。这是全球成员知识分享和网络交流的空间。',
    MentorUp: 'MentorUp',
    'Ready to Accelerate Your Career? ': '准备好加速您的职业发展了吗？',
    'We Offer': '我们提供',
    'More Features Coming': '更多功能即将上线',
    'Meet Our Mentors!': '认识我们的导师！',
    'Meet all mentors': '查看全部导师',
    'Affordable Mentorship, Proven Job Outcomes':
      '实惠的导师指导，显著的职业成果',
    'Per Mentor Session': '每次导师会话的平均价格',
    'Per Mentor Session description': '每次导师会话的平均价格',
    'See Interview Invitations': '满意度',
    'See Interview Invitations description': '以低价预约导师每节课50-80美元（更多优惠——只需30美元即可预约导师）',
    'Job Offers': '接受指导后获得工作机会的比例',
    'Job Offers description': '行业平均水平：20-30%',
    'Trusted by 1,300+ Students': '1300+学员的信赖之选',
    'Got Questions?': '常见问题',
    'How do I apply to become a mentor?': '如何申请成为导师？',
    'What payment methods do you accept?': '支持哪些支付方式？',
    'How can I update my account details?': '如何更新我的账户信息？',
    'Who can I contact about orders or appointments?':
      '订单或预约相关问题如何联系？',
    'How do I request a refund?': '如何申请退款？',
    faq1: '如需申请成为导师，请访问"成为导师"页面并填写申请表。我们的团队将在3-5个工作日内审核并回复您。',
    faq2: '我们支持主流信用卡和 PayPal，微信支付暂未开放，敬请期待。',
    faq3: '登录后可在个人主页更新账户信息。',
    faq4: '如有订单或预约相关问题，请联系contactus@mentorup.info。',
    faq5: '如需申请退款，请在订单历史中点击相关订单旁的"申请退款"按钮。',
    'Kevin Zhang': 'Kevin Zhang',
    'Senior Software Engineer at Google': '谷歌高级软件工程师',
    '8 years': '8年',
    'Back-end development (Java/K8s), previously at Amazon':
      '后端开发（Java/K8s），曾就职于亚马逊',
    'Linda Chen': 'Linda Chen',
    'Product Designer at Airbnb': 'Airbnb产品设计师',
    '6 years': '6年',
    'UI/UX design; CMU grad, interned at IDEO':
      'UI/UX设计，卡内基梅隆毕业，曾在IDEO实习',
    'Eric Tan': 'Eric Tan',
    'Data Engineer at Netflix': 'Netflix数据工程师',
    '10 years': '10年',
    'Infrastructure engineering; helped scale systems for millions of users':
      '基础设施工程，助力系统扩展至百万级用户',
    'James - Ohio State University': 'James - 俄亥俄州立大学',
    'Yuki - SDE': 'Yuki - SDE',
    'No Connection, No Problem': '无关系也无妨',
    'From Layoff to Dream Offer': '从失业到理想Offer',
    testimonial1:
      '我没有任何人脉，领英消息都石沉大海。MentorUp的教练帮我优化简历、模拟面试、规划职业路径。现在我已拿到理想offer，太开心了！',
    testimonial2:
      '被裁员后，数月的拒信让我很沮丧。几次导师会面和模拟面试帮我找准弱点并提升。现在我已拿到理想职位——MentorUp真的改变了我。',
      roles: [
        "软件工程师",
        "数据科学家",
        "机器学习工程师",
        "产品经理",
        "数据工程师",
        "数据分析师",
        "金融分析师",
        "量化分析师",
        "顾问",
        "UI/UX 设计师"
      ]
  }
};

export default function Home() {
  const [language, setLanguage] = useState<'en' | 'zh'>('en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { isMentor, loading: isMentorLoading } = useMentorStatus();
  const typingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchMentors() {
      try {
        const res = await fetch(
          `/api/mentor/list`,
          {
            cache: "no-store",
            next: { tags: ["mentorlist"] }
          }
        );
        const data = await res.json()

        const filteredMentors = data.data.filter(
         (m: Mentor) => m.mentor?.default_ranking !== 1000
        );

        setMentors(filteredMentors || []);
      } catch (err) {
        console.error("Error fetching mentors:", err);
      }
    }

    fetchMentors();
  }, []);

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

  // Hero section Typing effect logic
  useEffect(() => {
    const roles = translations[language].roles;

    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeoutId: NodeJS.Timeout;

    const typingSpeed = 100;
    const eraseSpeed = 50;
    const delayAfterTyping = 1200; // pause after a word is fully typed
    const delayAfterErasing = 500; // pause after erase before typing next

    function type() {
      const typingElement = typingRef.current;
      if (!typingElement) return;

      const currentRole = roles[roleIndex];

      if (!isDeleting && charIndex <= currentRole.length) {
        // Typing forward
        typingElement.textContent = currentRole.substring(0, charIndex);
        charIndex++;
        timeoutId = setTimeout(type, typingSpeed);
      } else if (isDeleting && charIndex >= 0) {
        // Erasing backward
        typingElement.textContent = currentRole.substring(0, charIndex);
        charIndex--;
        timeoutId = setTimeout(type, eraseSpeed);
      } else {
        // Finished typing or erasing
        if (!isDeleting) {
          isDeleting = true;
          timeoutId = setTimeout(type, delayAfterTyping); // wait before erasing
        } else {
          isDeleting = false;
          roleIndex = (roleIndex + 1) % roles.length;
          timeoutId = setTimeout(type, delayAfterErasing); // wait before typing next
        }
      }
    }

    type();

    return () => {
      // ✅ cleanup any running timeouts when language changes or unmounts
      clearTimeout(timeoutId);
    };
  }, [language]);

  // Custom translation function that mimics useTranslation from next-i18next
  const t = (key: string) => {
    return (
      translations[language][
        key as keyof (typeof translations)[typeof language]
      ] || key
    );
  };

  const faqs = [
    {
      q: t('How do I apply to become a mentor?'),
      a: t('faq1')
    },
    {
      q: t('What payment methods do you accept?'),
      a: t('faq2')
    },
    {
      q: t('How can I update my account details?'),
      a: t('faq3')
    },
    {
      q: t('Who can I contact about orders or appointments?'),
      a: t('faq4')
    },
    {
      q: t('How do I request a refund?'),
      a: t('faq5')
    }
  ];

  const i18n = {
    language,
    changeLanguage: (newLang: 'en' | 'zh') => {
      setLanguage(newLang);
    }
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(nextLang);
  };

    function MentorSlider({ mentors }: { mentors: any[] }) {
        const [startIndex, setStartIndex] = useState(0);
        const visibleCount = 3;
        const total = mentors.length;

        useEffect(() => {
            if (total <= visibleCount) return;
            const timer = setInterval(() => {
                setStartIndex((prev) => (prev + 1) % total);
            }, 3500);
            return () => clearInterval(timer);
        }, [total]);

        const visibleMentors = [];
        for (let i = 0; i < Math.min(visibleCount, total); i++) {
            visibleMentors.push(mentors[(startIndex + i) % total]);
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                {visibleMentors.map((mentor, idx) => {
                    const name = mentor.username;
                    const title = `${mentor.mentor?.title || ""}${
                        mentor.mentor?.company ? " @" + mentor.mentor.company : ""
                    }`;
                    const experience = mentor.mentor?.years_of_experience
                        ? `${mentor.mentor.years_of_experience} years`
                        : "";
                    const lastService = mentor.mentor?.services?.length
                        ? mentor.mentor.services[mentor.mentor.services.length - 1]
                        : null;

                    const netPrice =
                        typeof lastService?.price === "number" ? lastService.price : null;
                    const grossPrice = netPrice !== null ? netToGross(netPrice) : null;
                    const price = grossPrice !== null ? `$${grossPrice}/hr` : "";
                    const desc = mentor.introduction || "";
                    const img =
                        mentor.avatar_url ||
                        mentor.profile_url ||
                        "/images/placeholder-avatar.png";

                    return (
                        <div
                            key={mentor.user_id + idx}
                            className="bg-white border rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300"
                        >
                            {/* ✅ 图片部分：与上传示例相同的比例和圆角 */}
                            <div className="relative w-full" style={{ aspectRatio: "8 / 7" }}>
                                <img
                                    src={img}
                                    alt={name}
                                    className="w-full h-full object-cover rounded-tr-[40px] rounded-bl-[40px]"
                                />
                            </div>

                            {/* ✅ 文字部分 */}
                            <div className="p-5 flex flex-col items-start text-left">
                                <div className="font-bold text-lg mb-1">{name}</div>
                                <div className="text-gray-700 mb-2 font-medium">{title}</div>
                                <div className="text-gray-500 text-sm mb-3">{experience}</div>
                                <div className="text-gray-700 text-sm mb-4">
                                    {desc.length > 140 ? desc.slice(0, 140) + "..." : desc}
                                </div>
                                <a
                                    href={`/mentor/${mentor.user_id}`}
                                    className="text-blue-600 text-sm font-medium hover:underline"
                                >
                                    Learn More →
                                </a>
                            </div>
                        </div>
                    );
                })}
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
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <meta name='description' content={t('pageDescription') as string} />
      </Head>

      <main className='min-h-screen bg-gradient-to-b flex flex-col items-center justify-center p-6'>
        <header className='w-full text-gray-700 flex justify-between items-center py-4 px-4 mx-auto z-10'>
          <div className='hidden md:block'>
            <span className='text-2xl font-bold'>MentorUp</span>
          </div>
          <div className='flex items-center'>
            {/* Desktop Menu */}
            <nav className='space-x-4 hidden md:flex'>
              <div className='flex items-center space-x-2'>
                <Switch
                  checked={i18n.language === 'zh'}
                  onChange={toggleLanguage}
                />
                <span>{i18n.language === 'zh' ? '中文' : 'Eng'}</span>
              </div>
              <Space>
                <SignedOut>
                  <div className='flex gap-2'>
                    <SignUpButton mode='modal'>
                      <Button type='primary'>Become a Mentor</Button>
                    </SignUpButton>{' '}
                    <SignInButton mode='modal'>
                      <Button type='default'>Login</Button>
                    </SignInButton>
                  </div>
                </SignedOut>
                <SignedIn>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    {!isMentorLoading && isMentor === false && (
                      <Button type='primary' onClick={handleBecomeMentor}>
                        Become a Mentor
                      </Button>
                    )}
                    {isSignedIn && (
                      <div className='relative' ref={dropdownRef}>
                        <button
                          onClick={() => setOpen((o) => !o)}
                          className='flex items-center space-x-2 focus:outline-none'
                        >
                          <img
                            src={user.imageUrl}
                            alt='User'
                            className='w-8 h-8 rounded-full'
                          />
                          <span>{user.firstName}</span>
                        </button>
                        {open && (
                          <div className='absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50'>
                            <a
                              href={`/mentee-profile/${user.id}`}
                              className='block px-4 py-2 hover:bg-gray-100'
                            >
                              Mentee Profile
                            </a>
                            {isMentor && (
                              <a
                                href={`/mentor-profile/${user.id}`}
                                className='block px-4 py-2 hover:bg-gray-100'
                              >
                                Mentor Profile
                              </a>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                signOut();
                              }}
                              className='w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600'
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
            <div className='flex items-center justify-between w-full'>
              {/* Left button */}
              <Button
                type='text'
                icon={<MenuOutlined />}
                className='md:hidden'
                onClick={() => setMobileMenuOpen(true)}
              />

              {/* Right button */}
              <SignedOut>
                <SignUpButton mode='modal'>
                  <Button type='primary' className='md:hidden'>
                    Become a Mentor/Mentee
                  </Button>
                </SignUpButton>
              </SignedOut>
            </div>

            {/* Mobile Menu Drawer */}
            <Drawer
              title='Menu'
              placement='right'
              onClose={() => setMobileMenuOpen(false)}
              open={mobileMenuOpen}
              className='md:hidden'
            >
              <div className='flex flex-col space-y-4'>
                <div className='flex items-center justify-center space-x-2'>
                  <Switch
                    checked={i18n.language === 'zh'}
                    onChange={toggleLanguage}
                  />
                  <span>{i18n.language === 'zh' ? '中文' : 'Eng'}</span>
                </div>
                <SignedOut>
                  <SignInButton mode='modal'>
                    <Button type='text' block>
                      Login
                    </Button>
                  </SignInButton>
                  <SignUpButton mode='modal'>
                    <Button type='primary' block>
                      Become a Mentor/Mentee
                    </Button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      flexDirection: 'column'
                    }}
                  >
                    {!isMentor && (
                      <Button type='primary' onClick={handleBecomeMentor}>
                        Become a Mentor
                      </Button>
                    )}
                    {isSignedIn && (
                      <div className='relative' ref={dropdownRef}>
                        <button
                          onClick={() => setOpen((o) => !o)}
                          className='flex items-center space-x-2 focus:outline-none'
                        >
                          <img
                            src={user.imageUrl}
                            alt='User'
                            className='w-8 h-8 rounded-full'
                          />
                          <span>{user.firstName}</span>
                        </button>
                        {open && (
                          <div className='absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50'>
                            <a
                              href={`/mentee-profile/${user.id}`}
                              className='block px-4 py-2 hover:bg-gray-100'
                            >
                              Mentee Profile
                            </a>
                            {isMentor && (
                              <a
                                href={`/mentor-profile/${user.id}`}
                                className='block px-4 py-2 hover:bg-gray-100'
                              >
                                Mentor Profile
                              </a>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                signOut();
                              }}
                              className='w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600'
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



          {/* HERO SECTION */}
          <section className="relative w-full flex flex-col items-center pt-24 pb-40">

              {/* blue circle background  */}
              <div className={styles.backgroundCircle}></div>

              {/* Text Block */}
              <div className="text-center mt-10">
                  <h1 className="text-blue-600 font-bold text-4xl md:text-6xl mb-2">
                      1-on-1 Mentorship
                  </h1>

                  <h2 className="text-gray-700 text-xl md:text-2xl font-medium">
                      Personalized guidance to accelerate your career
                  </h2>

                  <div className="mt-3 text-lg md:text-2xl text-gray-800 font-semibold">
                      {t("1-on-1 Mentorship with")}{" "}
                      <span ref={typingRef} className="font-bold text-blue-600"></span>
                  </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-4 mt-6">
                  <Link
                      href="/mentor-list"
                      className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition"
                  >
                      Find Your Mentor
                  </Link>

                  <Link
                      href="/booking/free"
                      className="px-6 py-3 bg-white border border-blue-600 text-blue-600 rounded-full font-medium hover:bg-gray-100 transition"
                  >
                      Book a FREE Trial Session Now!
                  </Link>
              </div>

              {/* 📱 Device Mockups */}
              <div className="relative mt-16 w-full flex justify-center">

                  {/* MacBook and iPhone */}
                  <img
                      src="/landing page images/123.png"
                      className="w-[900px] max-w-[90%] drop-shadow-2xl"
                      alt="MentorUp Video Mentorship"
                  />

              </div>

              {/* Floating Role Tags */}
              <div>
                  {/* Left tags */}
                  <img src="/landing page images/Frame 1707480479.png"
                       className="absolute top-[28%] left-[8%] w-[140px] md:w-[180px] floatingTag" />
                  <img src="/landing page images/Frame 1707480480.png"
                       className="absolute top-[45%] left-[6%] w-[200px] md:w-[250px] floatingTag delay-100" />
                  <img src="/landing page images/Frame 1707480484.png"
                       className="absolute top-[62%] left-[13%] w-[170px] floatingTag delay-200" />

                  {/* Right tags */}
                  <img src="/landing page images/Frame 1707480482.png"
                       className="absolute top-[30%] right-[9%] w-[160px] floatingTag delay-300" />
                  <img src="/landing page images/Frame 1707480483.png"
                       className="absolute top-[48%] right-[5%] w-[220px] floatingTag delay-400" />
                  <img src="/landing page images/Frame 1707480486.png"
                       className="absolute top-[65%] right-[12%] w-[220px] floatingTag delay-500" />
                  <img src="/landing page images/Frame 1707480485.png"
                       className="absolute bottom-[8%] right-[15%] w-[160px] floatingTag delay-600" />

                  {/* Dots */}
                  <img src="/landing page images/Frame 1707480487.png"
                       className="absolute bottom-[4%] right-[8%] w-[70px] floatingTag delay-700" />
              </div>

          </section>




        <MarqueeSection />

        {/* --- Start max-width wrapper --- */}
        <div className='w-full max-w-6xl mx-auto px-4'>

          {/* 2. MEET OUR MENTORS SLIDER SECTION */}
          <section className='w-full py-12'>
            <div className='flex items-center justify-between mb-6 px-4'>
                <h2 className='text-2xl md:text-3xl font-bold text-black'>
                    {t('Meet Our')}{' '}
                    <span className='text-blue-500'>{t('Mentors!')}</span>
                </h2>

                <Link href='/mentor-list'>
                    <button className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition flex items-center gap-2'>
                        <SearchOutlined />
                        {t('Meet all mentors')}
                    </button>
                </Link>
            </div>
            {/* Simple slider implementation */}
            <MentorSlider mentors={mentors} />
          </section>

            {/* AFFORDABLE MENTORSHIP / OUTCOMES SECTION */}
            <section className="w-full py-16 bg-white">
                <div className="w-full max-w-6xl mx-auto px-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-black mb-12 text-left">
                        {t("Affordable Mentorship, Proven Job Outcomes")}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {[
                            { value: "$50+", label: "Per Mentor Session" },
                            { value: "73%", label: "Interview Invitations" },
                            { value: "51%", label: "Land Job Offers" },
                        ].map((item, idx) => (
                            <div
                                key={idx}
                                className="rounded-[18px] shadow-sm bg-gradient-to-br from-[#cfe3ff] via-[#78a9ff] to-[#1766ff] text-white flex flex-col items-center justify-center text-center transition-transform duration-300 hover:scale-[1.015] aspect-[1.1/1]"
                            >
                                <div className="text-5xl font-bold mb-2">{item.value}</div>
                                <div className="text-base font-medium opacity-95">{t(item.label)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TESTIMONIAL SECTION */}
            <section className="w-full py-16 bg-white">
                <div className="w-full max-w-6xl mx-auto px-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-black mb-12 text-left">
                        {t("Trusted by 1,300+ Students")}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                        {[
                            {
                                title: "Landed a Job Despite the Layoffs",
                                text: "After a tech layoff, my mentor helped me stand out in a crowded market. I accepted a new role with a significant pay increase in just three months.",
                                author: "Yuki · Ohio State University",
                                avatar: "/images/home_student_avatar_1.png",
                            },
                            {
                                title: "Negotiated a $50k Higher Offer",
                                text: "I had a good consulting offer, but my mentor gave me the playbook to negotiate a great one. The confidence alone was worth it.",
                                author: "James · SDE",
                                avatar: "/images/home_student_avatar_2.png",
                            },
                            {
                                title: "Real Advice from Real Industry Experts",
                                text: "Unlike those random internet courses, this was personal, and it made all the difference. My consulting mentor shared the inside scoop that helped me get hired at a great firm. Definitely worth it.",
                                author: "James · SDE",
                                avatar: "/images/home_student_avatar_2.png",
                            },
                            {
                                title: "Promoted from Junior to Senior in 18 Months",
                                text: "I wanted to fast-track my career, and my mentor’s guidance on leadership and communication made it happen. I earned a Senior promotion much sooner than expected and feel ready for what’s next.",
                                author: "James · SDE",
                                avatar: "/images/home_student_avatar_2.png",
                            },
                            {
                                title: "Pivoted from Academia to AI.",
                                text: 'My mentor translated my PhD into industry-ready skills. I successfully pivoted and now work as a Machine Learning Scientist.',
                                author: "James · SDE",
                                avatar: "/images/home_student_avatar_2.png",
                            },
                            {
                                title: "Accepted to My Dream MSCS Program",
                                text: "The competition for top-tier grad programs is insane. My mentor, an alum from my target school, helped me craft a statement of purpose that told a compelling story. Their insight was the differentiator in a hyper-competitive pool.",
                                author: "Yuki · Carnegie Mellon University",
                                avatar: "/images/home_student_avatar_1.png",
                            },
                        ].map((item, idx) => (
                            <div
                                key={idx}
                                className="bg-[#edf4ff] rounded-xl p-7 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300"
                            >
                                <div>
                                    <h3 className="text-lg font-semibold text-blue-700 mb-2">
                                        {item.title}
                                    </h3>
                                    <div className="text-3xl text-gray-600 mb-2 leading-none">“</div>
                                    <p className="text-gray-800 mb-4 leading-relaxed">{item.text}</p>
                                    <div className="text-3xl text-gray-600 text-right leading-none">”</div>
                                </div>

                                <div className="flex items-center mt-4">
                                    <img
                                        src={item.avatar}
                                        alt={item.author}
                                        className="w-10 h-10 rounded-full mr-3 border border-gray-200"
                                    />
                                    <span className="text-gray-600 text-sm">{item.author}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. FAQ COLLAPSE SECTION */}
          <section className='w-full py-12'>
            <h2 className='text-2xl md:text-3xl font-bold text-black mb-6 px-4'>
              {t('Got Questions?')}
            </h2>
            <div className=' w-full'>
                <Collapse
                    accordion
                    bordered={false}
                    expandIcon={({ isActive }) => (
                        <CaretRightOutlined rotate={isActive ? 90 : 0} style={{ color: "#1677ff" }} />
                    )}
                    className="custom-faq-collapse"
                >
                    {faqs.map((faq, idx) => (
                        <Collapse.Panel
                            header={
                                <span className="font-medium text-base text-gray-800">
          <span className="text-blue-500 font-semibold mr-2">
            Q{idx + 1}.
          </span>
                                    {faq.q}
        </span>
                            }
                            key={idx}
                        >
                            <div className="text-gray-700 text-base leading-relaxed">{faq.a}</div>
                        </Collapse.Panel>
                    ))}
                </Collapse>
            </div>
          </section>
          {/* --- End max-width wrapper --- */}
        </div>
      </main>

        <style jsx global>{`
            html,
            body,
            #__next {
                max-width: 100%;
                overflow-x: hidden;
            }
            main,
            footer {
                overflow-x: hidden;
            }

            .custom-faq-collapse {
                background: #fff !important; /* ✅ 去掉外层灰底 */
                border: none !important;
                box-shadow: none !important;
            }

            .custom-faq-collapse .ant-collapse-item {
                background: #fff !important;
                border-radius: 10px;
                margin-bottom: 12px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
            }

            .custom-faq-collapse .ant-collapse-header {
                font-size: 16px;
                font-weight: 500;
                padding: 14px 20px !important;
            }

            .custom-faq-collapse .ant-collapse-content {
                background: #fff !important;
            }

            .custom-faq-collapse .ant-collapse-content-box {
                padding: 12px 20px;
                background: #fff !important;
                border-top: 1px solid #f0f0f0;
            }

            .custom-faq-collapse .ant-collapse-expand-icon {
                margin-inline-end: 8px;
            }

            .custom-faq-collapse .ant-collapse-arrow {
                color: #1677ff;
            }

            .custom-faq-collapse .ant-collapse-item {
                border-radius: 10px !important;
                overflow: hidden !important;
            }

            /* ✅ 防止第一个和最后一个被覆盖掉圆角 */
            .custom-faq-collapse .ant-collapse-item:first-child,
            .custom-faq-collapse .ant-collapse-item:last-child {
                border-radius: 10px !important;
            }

            /* ✅ 去掉边框连接线 */
            .custom-faq-collapse .ant-collapse-item:not(:last-child) {
                border-bottom: none !important;
            }
        `}</style>

    </>
  );
}
