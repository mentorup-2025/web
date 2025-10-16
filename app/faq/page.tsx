// app/faq/page.tsx
'use client';

import { useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Collapse, Switch, Button } from 'antd';
import { SignedIn, SignedOut, SignInButton, SignUpButton, useUser, useClerk } from '@clerk/nextjs';

export default function FAQPage() {
    const [language, setLanguage] = useState<'en' | 'zh'>('en');
    const { user, isSignedIn } = useUser();
    const { signOut } = useClerk();
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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

            // Section titles
            General: 'General',
            Payment: 'Payment',
            AccountSession: 'Account & Session',

            // General
            q_become: 'How to become a mentor?',
            a_become:
                'To apply as a mentor, simply click the "Become a Mentor" button (top right corner) and fill out the application form.',
            q_trial_mentee: 'What is a Free Trial Session?',
            a_trial_mentee:
                'We offer a 15-minute Free Trial Session that you can book with any mentor who provides free coffee chats. Each member receives one free trial. Use it to get a feel for a mentor’s experience and communication style.',

            // Payment
            q_pay_methods_mentee: 'What payment methods do you accept?',
            a_pay_methods_mentee:
                'For mentees (students), we currently accept major credit cards and debit cards, and PayPal. Support for WeChat Pay is coming soon.',
            q_payout_methods_mentor: 'What are the payout methods for mentors?',
            a_payout_methods_mentor_1:
                'USD Payout — Biweekly direct deposit to your USD account. If your annual income exceeds $600, we are required to issue you a Form 1099 for tax reporting.',
            a_payout_methods_mentor_2:
                'WeChat Pay (RMB) — Payouts are processed at the beginning of each month.',
            a_payout_methods_mentor_3:
                'Alipay (RMB) — Also processed monthly at the beginning of each month.',

            // Account & Session
            q_update_account: 'How can I update my account details?',
            a_update_account:
                'You can update your account information directly from your Profile Page after logging in.',
            q_contact_support: 'Who can I contact about orders or appointments?',
            a_contact_support:
                'For any order or appointment inquiries, please contact our support team at contactus@mentorup.info.',
            q_cancel_refund: 'Cancel and Refund Policy',
            a_cancel_refund:
                'If you wish to cancel a session, please cancel at least 48 hours in advance for a full refund. Cancellations made within 48 hours will incur a $5 processing fee. To cancel or reschedule, go to “My Sessions” and click the Reschedule or Cancel button for that session.',
            q_issue_session: "What should I do if there’s an issue with my session?",
            a_issue_session:
                "If you experience any issues during your session—such as a no-show, feeling dissatisfied, or wanting to report misconduct—please click “Report Issue” under your session details in “My Sessions.” Our team will review it within 48 hours and work with you to resolve the situation.",
            q_reschedule: 'How do I reschedule a session?',
            a_reschedule:
                'Go to “My Sessions”, find the session you want to change, and click “Reschedule”. You can propose a new available time with the same mentor.',
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
            heroTitleLine2: 'Questions', // 为了品牌一致，这里保留英文主标题

            // Section titles
            General: '通用',
            Payment: '支付与结算',
            AccountSession: '账户与会话',

            // General
            q_become: '如何申请成为导师？',
            a_become:
                '点击右上角“成为导师”并填写表单即可申请。',
            q_trial_mentee: '什么是免费试聊？',
            a_trial_mentee:
                '我们提供 15 分钟“Free Trial Session”（免费咖啡聊），每位用户可获得一次，用于先了解导师的经验与沟通风格。',

            // Payment
            q_pay_methods_mentee: '支持哪些支付方式？',
            a_pay_methods_mentee:
                '学员（学生）端目前支持主流信用卡/借记卡与 PayPal；微信支付即将上线。',
            q_payout_methods_mentor: '导师有哪些收款方式？',
            a_payout_methods_mentor_1:
                '美元打款——每两周结算一次直接打入您的美元账户；若年收入超过 600 美元，我们将开具 1099 税表。',
            a_payout_methods_mentor_2:
                '微信收款（人民币）——每月月初处理上一周期款项。',
            a_payout_methods_mentor_3:
                '支付宝收款（人民币）——同样在每月月初处理。',

            // Account & Session
            q_update_account: '如何更新我的账户信息？',
            a_update_account: '登录后可在个人主页直接更新账户信息。',
            q_contact_support: '订单或预约问题如何联系？',
            a_contact_support:
                '请联系邮箱 contactus@mentorup.info。',
            q_cancel_refund: '取消与退款政策',
            a_cancel_refund:
                '若需取消会话，请至少提前 48 小时以获得全额退款；48 小时内取消将收取 $5 手续费。进入“我的会话”点击相应记录的“改期”或“取消”即可操作。',
            q_issue_session: '会话中出现问题怎么办？',
            a_issue_session:
                '如出现未到场、不满意或想举报不当行为，请在“我的会话”详情页点击“Report Issue（报告问题）”。我们会在 48 小时内审核并协助处理。',
            q_reschedule: '如何改期？',
            a_reschedule:
                '进入“我的会话”，找到目标会话点击“改期”，即可向同一位导师提出新的可用时间。',
        },
    };

    const t = (key: keyof typeof translations['en']) =>
        translations[language][key] ?? key;

    const i18n = {
        language,
        changeLanguage: (l: 'en' | 'zh') => setLanguage(l),
    };

    const toggleLanguage = () => {
        i18n.changeLanguage(i18n.language === 'en' ? 'zh' : 'en');
    };

    const sections = [
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
    ];

    return (
        <>
            <Head>
                <title>{t('pageTitle')}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="description" content={t('pageDescription')} />
            </Head>

            <main className="min-h-screen bg-white flex flex-col">
                {/* Header —— 保持与 landing 一致的布局与交互 */}
                <header className="w-full text-gray-700 flex justify-between items-center py-4 px-4 mx-auto z-10">
                    <div className="hidden md:block">
                        <Link href="/" className="text-2xl font-bold">{translations[language].siteName}</Link>
                    </div>
                    <nav className="space-x-4 hidden md:flex items-center">
                        <div className="flex items-center space-x-2">
                            <Switch checked={i18n.language === 'zh'} onChange={toggleLanguage} />
                            <span>{translations[language].LangLabel}</span>
                        </div>
                        <Link href="/mentor-list">
                            <Button type="text">{translations[language].MeetMentors}</Button>
                        </Link>
                        <SignedOut>
                            <div className="flex gap-2">
                                <SignUpButton mode="modal">
                                    <Button type="primary">{translations[language].BecomeMentor}</Button>
                                </SignUpButton>
                                <SignInButton mode="modal">
                                    <Button type="default">{translations[language].Login}</Button>
                                </SignInButton>
                            </div>
                        </SignedOut>
                        <SignedIn>
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
                                        <a href={`/mentee-profile/${user?.id}`} className="block px-4 py-2 hover:bg-gray-100">
                                            Mentee Profile
                                        </a>
                                        <a href={`/mentor-profile/${user?.id}`} className="block px-4 py-2 hover:bg-gray-100">
                                            Mentor Profile
                                        </a>
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
                    </nav>
                </header>

                {/* Hero 区 —— 渐变气泡风格标题 */}
                <section className="relative px-4 pt-4 pb-10">
                    <div className="max-w-6xl mx-auto">
                        <div className="relative inline-block">
                            <div className="text-4xl md:text-5xl font-extrabold leading-tight text-black">
                                <span className="block">{translations[language].heroTitleLine1}</span>
                                <span className="block">{translations[language].heroTitleLine2}</span>
                            </div>
                            {/* 淡蓝色气泡背景（参考落地页视觉） */}
                            <div className="absolute -z-10 -top-6 -left-6 w-[320px] h-[140px] bg-blue-200/60 blur-2xl rounded-[36px]" />
                            <div className="absolute -z-10 top-10 left-64 w-[220px] h-[90px] bg-blue-100/70 blur-2xl rounded-[28px]" />
                        </div>
                    </div>
                </section>

                {/* FAQ 内容 */}
                <section className="w-full pb-16">
                    <div className="w-full max-w-6xl mx-auto px-4">
                        {sections.map((sec, sIdx) => (
                            <div key={sIdx} className="mb-10">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">{sec.title}</h3>
                                <Collapse accordion>
                                    {sec.items.map((it, iIdx) => (
                                        <Collapse.Panel header={it.q} key={`${sIdx}-${iIdx}`}>
                                            <div className="text-gray-700 text-base leading-7">
                                                {typeof it.a === 'string' ? <p>{it.a}</p> : it.a}
                                            </div>
                                        </Collapse.Panel>
                                    ))}
                                </Collapse>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* 全局防横向滚动，与落地页一致 */}
            <style jsx global>{`
        html, body, #__next {
          max-width: 100%;
          overflow-x: hidden;
        }
        main, footer {
          overflow-x: hidden;
        }
      `}</style>
        </>
    );
}
