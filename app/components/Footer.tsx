// components/Footer.tsx
'use client';

import { useState } from "react";
import Link from "next/link";

export default function Footer() {
    // [ADDED] 控制微信二维码弹窗
    const [wechatOpen, setWechatOpen] = useState(false);

    return (
        <footer className="bg-[#E6F7FF] text-black">
            {/* 外层容器：去掉强制固定宽度，移动端自适应 */}
            <div className="mx-auto w-full max-w-[1280px] px-6 md:px-[120px] py-5">
                <div className="flex flex-col gap-2.5">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start md:gap-24 py-5">
                        {/* 品牌部分 */}
                        <div className="w-full md:w-[305px] flex flex-col gap-5">
                            <div className="flex flex-col gap-3">
                                <div className="text-[30px] leading-[38px] md:text-[38px] md:leading-[46px] font-medium text-[#096DD9]">
                                    MentorUp
                                </div>
                                <p className="text-[13px] md:text-[14px] leading-[20px] md:leading-[22px] text-black">
                                    Level up your career with personalized mentors
                                </p>

                                {/* ✅ 社交图标区域（已替换为微信 + 小红书） */}
                                <div className="mt-2 flex items-center gap-5">
                                    {/* [CHANGED] 原 LinkedIn 改为“微信”按钮，点击后弹出二维码 */}
                                    <button
                                        type="button"
                                        onClick={() => setWechatOpen(true)}
                                        aria-label="WeChat QR"
                                        title="WeChat"
                                        className="inline-flex items-center justify-center h-[28px] w-[28px] rounded-full hover:opacity-80 transition focus:outline-none focus:ring-2 focus:ring-[#1890ff]"
                                    >
                                        <img
                                            src="/wechat-footer.png"
                                            alt="WeChat"
                                            className="h-[22px] w-[22px] object-contain"
                                        />
                                    </button>

                                    {/* Xiaohongshu */}
                                    <Link
                                        href="https://www.xiaohongshu.com/user/profile/636b3f08000000001f01b5e1?xsec_token=ABVVlt13kuoRlfjPbKawqXXT5Q60TzP2TsVsejUBu3fkQ%3D&xsec_source=pc_search"
                                        aria-label="Xiaohongshu"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Xiaohongshu"
                                        className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-full hover:opacity-80 transition focus:outline-none focus:ring-2 focus:ring-[#1890ff]"
                                    >
                                        <img
                                            src="/xiaohongshu.png"
                                            alt="Xiaohongshu"
                                            className="h-[22px] w-[22px] object-contain"
                                        />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* 三列导航：移动端 2 列，md 起 3 列 */}
                        <div className="mt-7 grid w-full max-w-[700px] grid-cols-2 sm:grid-cols-3 gap-5 md:mt-0">
                            {/* About */}
                            <div className="flex flex-col items-start px-4 py-4 gap-4">
                                <h3 className="text-[20px] leading-[28px] md:text-[24px] md:leading-[32px] font-medium text-[#595959]">
                                    About
                                </h3>
                                <ul className="space-y-2.5 text-[12px] leading-4 text-[#595959]">
                                    <li><Link href="/about" className="hover:underline">About Us</Link></li>
                                </ul>
                            </div>

                            {/* Support */}
                            <div className="flex flex-col items-start px-4 py-4 gap-4">
                                <h3 className="text-[20px] leading-[28px] md:text-[24px] md:leading-[32px] font-medium text-[#595959]">
                                    Support
                                </h3>
                                <ul className="space-y-2.5 text-[12px] leading-4 text-[#595959]">
                                    <li><Link href="/faq" className="hover:underline">FAQs</Link></li>
                                    <li>
                                        <a
                                            href="mailto:contactus@mentorup.info"
                                            className="hover:underline"
                                        >
                                            Contact
                                        </a>
                                    </li>
                                    <li><Link href="/chatbot?from=footer&item=payment" className="hover:underline">Payment</Link></li>
                                    <li><Link href="/chatbot?from=footer&item=cancel-refund" className="hover:underline">Cancel &amp; Refund</Link></li>
                                </ul>
                            </div>

                            {/* Service */}
                            <div className="flex flex-col items-start px-4 py-4 gap-4">
                                <h3 className="text-[20px] leading-[28px] md:text-[24px] md:leading-[32px] font-medium text-[#595959]">
                                    Service
                                </h3>
                                <ul className="space-y-2.5 text-[12px] leading-4 text-[#595959]">
                                    <li><Link href="/chatbot?from=footer&item=free-trial" className="hover:underline">Free Trial Session</Link></li>
                                    <li><Link href="/chatbot?from=footer&item=career-package" className="hover:underline">Career Package</Link></li>
                                    <li><Link href="/chatbot?from=footer&item=become-mentor" className="hover:underline">Become a Mentor</Link></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* 分割线：改为自适应宽度 */}
                    <div className="w-full">
                        <div className="h-px w-full border-t border-[rgba(0,0,0,0.06)]" />
                    </div>

                    {/* 底部版权：自适应布局 */}
                    <div className="flex w-full flex-col justify-between gap-3 py-3 md:flex-row md:items-center">
                        <p className="text-[13px] md:text-[14px] leading-[20px] md:leading-[22px] text-[#8C8C8C]">
                            ©2025 MentorUp. All rights reserved
                        </p>
                        <div className="flex items-center gap-4">
                            <Link href="/privacy" className="text-[13px] md:text-[14px] leading-[20px] md:leading-[22px] text-[#8C8C8C] underline hover:opacity-80">
                                Privacy Policy
                            </Link>
                            <Link href="/terms" className="text-[13px] md:text-[14px] leading-[20px] md:leading-[22px] text-[#8C8C8C] underline hover:opacity-80">
                                Terms of Use
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* [ADDED] 微信二维码弹窗（无第三方库，纯 Tailwind） */}
            {wechatOpen && (
                <div
                    className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label="WeChat QR Modal"
                    onClick={() => setWechatOpen(false)} // 点击遮罩关闭
                >
                    <div
                        className="w-full max-w-[340px] rounded-2xl bg-white p-5 shadow-xl"
                        onClick={(e) => e.stopPropagation()} // 阻止冒泡
                    >
                        <div className="flex items-center justify-between">
                            <h4 className="text-[16px] font-medium text-[#262626]">
                                Follow us on WeChat
                            </h4>
                            <button
                                className="h-8 w-8 rounded-full hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-[#1890ff]"
                                aria-label="Close"
                                onClick={() => setWechatOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mt-4 flex flex-col items-center text-center">
                            {/* ✅ 微信二维码 */}
                            <img
                                src="/wechat-qr.png"
                                alt="WeChat QR Code"
                                className="w-[240px] h-[240px] rounded-md border border-black/10 object-contain"
                            />
                            <p className="mt-3 text-sm text-[#595959]">Scan the QR code in WeChat</p>

                            {/* ✅ 新增微信号展示 */}
                            <div className="mt-2 text-sm text-[#262626]">
                                <span className="font-medium text-[#096DD9]">WeChat ID:</span>{" "}
                                <span className="select-all">iampotato6</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </footer>
    );
}