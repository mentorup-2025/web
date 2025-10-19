'use client';

import { useState, useRef, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Collapse, Button } from 'antd';
import {
    SignedIn,
    SignedOut,
    SignInButton,
    SignUpButton,
    useUser,
    useClerk,
} from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useMentorStatus } from '../hooks/useMentorStatus'; // ✅ 路径按你项目实际调整

export default function FAQPage() {
    const [language, setLanguage] = useState<'en' | 'zh'>('en');
    const { user } = useUser();
    const { signOut } = useClerk();
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const { isMentor, loading: isMentorLoading } = useMentorStatus();

    const handleBecomeMentor = () => {
        if (user?.id) {
            router.push('/signup/mentor/' + user.id);
        }
    };

    const translations = {
        en: {
            pageTitle: 'MentorUp - FAQs',
            pageDescription: 'Frequently asked questions about MentorUp mentorship marketplace',
            siteName: 'MentorUp',
            MeetMentors: 'Meet Our Mentors',
            BecomeMentor: 'Become a Mentor',
            Login: 'Login',
            LangLabel: 'Eng',
            heroTitleLine1: 'Frequently Asked',
            heroTitleLine2: 'Questions',
            General: 'General',
            Payment: 'Payment',
            AccountSession: 'Account & Session',
            q_become: 'How to become a mentor?',
            a_become:
                'To apply as a mentor, simply click the "Become a Mentor" button (top right corner) and fill out the application form.',
            q_trial_mentee: 'What is a Free Trial Session?',
            a_trial_mentee:
                'We offer a 15-minute Free Trial Session that you can book with any mentor who provides free coffee chats. Each member receives one free trial.',
            q_pay_methods_mentee: 'What payment methods do you accept?',
            a_pay_methods_mentee:
                'We currently accept major credit/debit cards and PayPal. WeChat Pay support is coming soon.',
            q_payout_methods_mentor: 'What are the payout methods for mentors?',
            a_payout_methods_mentor_1:
                'USD direct deposit (biweekly). Income over $600 will trigger a 1099 form.',
            a_payout_methods_mentor_2: 'WeChat Pay (RMB) — monthly payouts.',
            a_payout_methods_mentor_3: 'Alipay (RMB) — monthly payouts.',
            q_update_account: 'How can I update my account details?',
            a_update_account: 'You can update your info on your Profile page after logging in.',
            q_contact_support: 'Who can I contact about orders or appointments?',
            a_contact_support: 'Please contact us at contactus@mentorup.info.',
            q_cancel_refund: 'Cancel and Refund Policy',
            a_cancel_refund:
                'Cancel 48 hours in advance for full refund; within 48 hours incurs $5 fee.',
            q_issue_session: 'What if there’s an issue with my session?',
            a_issue_session:
                'If issues occur (no-show, dissatisfaction, misconduct), click “Report Issue” under My Sessions.',
            q_reschedule: 'How do I reschedule?',
            a_reschedule: 'Go to “My Sessions”, find your session, and click “Reschedule”.',
        },
        zh: {
            pageTitle: 'MentorUp - 常见问题',
            pageDescription: 'MentorUp 导师平台常见问题解答',
            siteName: 'MentorUp',
            MeetMentors: '查看全部导师',
            BecomeMentor: '成为导师',
            Login: '登录',
            LangLabel: '中文',
            heroTitleLine1: 'Frequently Asked',
            heroTitleLine2: 'Questions',
            General: '通用',
            Payment: '支付与结算',
            AccountSession: '账户与会话',
            q_become: '如何申请成为导师？',
            a_become: '点击右上角“成为导师”并填写表单即可申请。',
            q_trial_mentee: '什么是免费试聊？',
            a_trial_mentee: '我们提供 15 分钟 Free Trial Session（免费咖啡聊），每位用户可获得一次。',
            q_pay_methods_mentee: '支持哪些支付方式？',
            a_pay_methods_mentee: '支持主流信用卡/借记卡和 PayPal，微信支付即将上线。',
            q_payout_methods_mentor: '导师有哪些收款方式？',
            a_payout_methods_mentor_1: '美元打款——每两周结算一次；年收入超 $600 开具 1099 税表。',
            a_payout_methods_mentor_2: '微信收款——每月初处理。',
            a_payout_methods_mentor_3: '支付宝收款——每月初处理。',
            q_update_account: '如何更新账户信息？',
            a_update_account: '登录后在个人主页可直接更新。',
            q_contact_support: '订单或预约问题如何联系？',
            a_contact_support: '请联系邮箱 contactus@mentorup.info。',
            q_cancel_refund: '取消与退款政策',
            a_cancel_refund: '提前 48 小时取消可全额退款；48 小时内取消收取 $5 手续费。',
            q_issue_session: '会话中出现问题怎么办？',
            a_issue_session: '点击“我的会话”里的 Report Issue，我们会在 48 小时内处理。',
            q_reschedule: '如何改期？',
            a_reschedule: '进入“我的会话”，点击目标会话的“改期”即可。',
        },
    };

    const t = (key: keyof typeof translations['en']) =>
        translations[language][key] ?? key;

    const sections = useMemo(
        () => [
            {
                title: t('General'),
                items: [
                    { q: t('q_become'), a: t('a_become') },
                    { q: t('q_trial_mentee'), a: t('a_trial_mentee') },
                ],
            },
            {
                title: t('Payment'),
                items: [
                    { q: t('q_pay_methods_mentee'), a: t('a_pay_methods_mentee') },
                    {
                        q: t('q_payout_methods_mentor'),
                        a: (
                            <div className="space-y-2">
                                <div>1. {t('a_payout_methods_mentor_1')}</div>
                                <div>2. {t('a_payout_methods_mentor_2')}</div>
                                <div>3. {t('a_payout_methods_mentor_3')}</div>
                            </div>
                        ),
                    },
                ],
            },
            {
                title: t('AccountSession'),
                items: [
                    { q: t('q_update_account'), a: t('a_update_account') },
                    { q: t('q_contact_support'), a: t('a_contact_support') },
                    { q: t('q_cancel_refund'), a: t('a_cancel_refund') },
                    { q: t('q_issue_session'), a: t('a_issue_session') },
                    { q: t('q_reschedule'), a: t('a_reschedule') },
                ],
            },
        ],
        [language]
    );

    return (
        <>
            <Head>
                <title>{t('pageTitle')}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="description" content={t('pageDescription')} />
            </Head>

            <main className="min-h-screen bg-white flex flex-col">
                {/* 顶栏 */}
                <header className="w-full border-b border-gray-200">
                    <div className="mx-auto w-full max-w-[1100px] px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <Link href="/" className="text-[18px] font-semibold text-black">
                                {translations[language].siteName}
                            </Link>
                            <span className="text-sm text-black underline decoration-1 underline-offset-1">
  FAQs
</span>


                        </div>

                        <div className="flex items-center gap-3">
                            {/* ✅ 新的 Become a Mentor 逻辑 */}
                            <SignedOut>
                                <SignUpButton mode="modal">
                                    <Button type="primary" className="rounded-full px-4">
                                        {translations[language].BecomeMentor}
                                    </Button>
                                </SignUpButton>
                                <SignInButton mode="modal">
                                    <Button type="default" className="rounded-full px-4">
                                        {translations[language].Login}
                                    </Button>
                                </SignInButton>
                            </SignedOut>

                            <SignedIn>
                                {!isMentorLoading && isMentor === false && (
                                    <Button
                                        type="primary"
                                        onClick={handleBecomeMentor}
                                        className="rounded-full px-4"
                                    >
                                        {translations[language].BecomeMentor}
                                    </Button>
                                )}

                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setOpen((o) => !o)}
                                        className="flex items-center space-x-2 focus:outline-none"
                                    >
                                        <img src={user?.imageUrl} alt="User" className="w-8 h-8 rounded-full" />
                                        <span>{user?.firstName}</span>
                                    </button>
                                    {open && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50">
                                            <a
                                                href={`/mentee-profile/${user?.id}`}
                                                className="block px-4 py-2 hover:bg-gray-100"
                                            >
                                                Mentee Profile
                                            </a>
                                            {isMentor && (
                                                <a
                                                    href={`/mentor-profile/${user?.id}`}
                                                    className="block px-4 py-2 hover:bg-gray-100"
                                                >
                                                    Mentor Profile
                                                </a>
                                            )}
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
                            </SignedIn>
                        </div>
                    </div>
                </header>

                {/* Hero */}
                <section className="relative mt-10 md:mt-16">
                    <div className="mx-auto w-full max-w-[1100px] px-4">
                        <div className="relative pt-4 pb-12 md:pt-6 md:pb-14">
                            <h1 className="relative z-10 text-black font-extrabold leading-[1.05] text-[40px] md:text-[46px]">
                                <span className="block">{translations[language].heroTitleLine1}</span>
                                <span className="block">{translations[language].heroTitleLine2}</span>
                            </h1>

                            {/* 第一个气泡（含箭头） */}
                            <div
                                className="absolute z-0 -top-2 -left-2 w-[460px] h-[180px]
             bg-blue-500/60 rounded-[40px] mix-blend-multiply
             before:content-[''] before:absolute
             before:bottom-[-30px] before:left-[120px]
             before:w-0 before:h-0
             before:border-l-[30px] before:border-r-[30px] before:border-t-[30px]
             before:border-l-transparent before:border-r-transparent
             before:border-t-blue-500/60 before:mix-blend-multiply"
                            />

                            {/* 第二个气泡（含箭头） */}
                            <div
                                className="absolute z-0 top-16 left-[360px] w-[280px] h-[120px]
             bg-blue-400/60 rounded-[30px] mix-blend-multiply
             before:content-[''] before:absolute
             before:bottom-[-25px] before:left-[80px]
             before:w-0 before:h-0
             before:border-l-[25px] before:border-r-[25px] before:border-t-[25px]
             before:border-l-transparent before:border-r-transparent
             before:border-t-blue-400/60 before:mix-blend-multiply"
                            />

                        </div>
                    </div>
                </section>

                {/* FAQ 内容 */}
                <section className="pb-20">
                    <div className="mx-auto w-full max-w-[1100px] px-4">
                        {sections.map((sec, idx) => (
                            <div
                                key={sec.title}
                                className={`grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-6 md:gap-12 ${
                                    idx > 0 ? 'mt-8 md:mt-12' : ''
                                }`}
                            >
                                <div className="text-[18px] md:text-[20px] font-semibold text-gray-900 md:pt-2">
                                    {sec.title}
                                </div>
                                <div className="w-full">
                                    <Collapse
                                        accordion
                                        bordered={false}
                                        className="faq-collapse"
                                        items={sec.items.map((it, i) => ({
                                            key: `${idx}-${i}`,
                                            label: (
                                                <span className="text-[16px] font-medium text-gray-900">{it.q}</span>
                                            ),
                                            children: (
                                                <div className="text-[14px] leading-7 text-gray-600">
                                                    {typeof it.a === 'string' ? <p>{it.a}</p> : it.a}
                                                </div>
                                            ),
                                            className: 'py-2',
                                        }))}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <style jsx global>{`
        html,
        body,
        #__next {
          max-width: 100%;
          overflow-x: hidden;
        }
        .faq-collapse > .ant-collapse-item {
          border-bottom: 1px solid #e5e7eb;
        }
        .faq-collapse > .ant-collapse-item > .ant-collapse-header {
          padding-left: 0;
          padding-right: 0;
          line-height: 1.5;
        }
        .faq-collapse .ant-collapse-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .faq-collapse .ant-collapse-expand-icon {
          order: 2;
          margin-left: auto;
          color: #1677ff !important;
          transition: transform 0.2s ease;
        }
        .faq-collapse .ant-collapse-item-active .ant-collapse-expand-icon svg {
          transform: rotate(90deg);
        }
        .faq-collapse,
        .faq-collapse .ant-collapse-content,
        .faq-collapse .ant-collapse-content > .ant-collapse-content-box {
          background-color: transparent !important;
        }
      `}</style>
        </>
    );
}
