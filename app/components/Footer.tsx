// components/Footer.tsx
'use client';

import { useState } from "react";
import Link from "next/link";

export default function Footer() {
    const [wechatOpen, setWechatOpen] = useState(false);

    return (
        <footer className="bg-[#E6F7FF] text-black">
            <div className="mx-auto w-full max-w-[1280px] px-6 md:px-[120px] py-5">
                <div className="flex flex-col gap-2.5">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start md:gap-24 py-5">
                        {/* 品牌（移动端：标题和图标同一行；md 起恢复原布局） */}
                        <div className="w-full md:w-[305px] flex flex-col gap-3">
                            <div className="flex items-center justify-between md:block">
                                <div className="text-left text-[26px] leading-[34px] md:text-[38px] md:leading-[46px] font-medium text-[#096DD9]">
                                    MentorUp
                                </div>

                                {/* 移动端社交图标（与标题同一行右侧） */}
                                <div className="mt-0 flex items-center gap-5 md:hidden">
                                    <button
                                        type="button"
                                        onClick={() => setWechatOpen(true)}
                                        aria-label="WeChat QR"
                                        title="WeChat"
                                        className="inline-flex items-center justify-center h-[28px] w-[28px] rounded-full hover:opacity-80 transition focus:outline-none focus:ring-2 focus:ring-[#1890ff]"
                                    >
                                        <img src="/wechat-footer.png" alt="WeChat" className="h-[22px] w-[22px] object-contain" />
                                    </button>

                                    <Link
                                        href="https://www.xiaohongshu.com/user/profile/636b3f08000000001f01b5e1?xsec_token=ABVVlt13kuoRlfjPbKawqXXT5Q60TzP2TsVsejUBu3fkQ%3D&xsec_source=pc_search"
                                        aria-label="Xiaohongshu"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Xiaohongshu"
                                        className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-full hover:opacity-80 transition focus:outline-none focus:ring-2 focus:ring-[#1890ff]"
                                    >
                                        <img src="/xiaohongshu.png" alt="Xiaohongshu" className="h-[22px] w-[22px] object-contain" />
                                    </Link>
                                </div>
                            </div>

                            <p className="text-left text-[13px] md:text-[14px] leading-[20px] md:leading-[22px] text-black">
                                Level up your career with personalized mentors
                            </p>

                            {/* 桌面端社交图标（标题下方） */}
                            <div className="mt-2 hidden items-center gap-5 md:flex">
                                <button
                                    type="button"
                                    onClick={() => setWechatOpen(true)}
                                    aria-label="WeChat QR"
                                    title="WeChat"
                                    className="inline-flex items-center justify-center h-[28px] w-[28px] rounded-full hover:opacity-80 transition focus:outline-none focus:ring-2 focus:ring-[#1890ff]"
                                >
                                    <img src="/wechat-footer.png" alt="WeChat" className="h-[22px] w-[22px] object-contain" />
                                </button>

                                <Link
                                    href="https://www.xiaohongshu.com/user/profile/636b3f08000000001f01b5e1?xsec_token=ABVVlt13kuoRlfjPbKawqXXT5Q60TzP2TsVsejUBu3fkQ%3D&xsec_source=pc_search"
                                    aria-label="Xiaohongshu"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Xiaohongshu"
                                    className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-full hover:opacity-80 transition focus:outline-none focus:ring-2 focus:ring-[#1890ff]"
                                >
                                    <img src="/xiaohongshu.png" alt="Xiaohongshu" className="h-[22px] w-[22px] object-contain" />
                                </Link>
                            </div>
                        </div>

                        {/* 导航区：移动端 1 列左对齐；md 起 3 列并占满宽度（让 Service 与底部隐私政策对齐） */}
                        <div className="mt-7 grid w-full grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 md:mt-0">
                            {/* About */}
                            <div className="flex flex-col items-start px-0 md:px-0 py-3 gap-3">
                                <h3 className="text-left text-[17px] leading-[24px] md:text-[22px] md:leading-[30px] font-medium text-[#595959]">
                                    About
                                </h3>
                                <ul className="space-y-2 text-left text-[13px] leading-[20px] md:text-[12px] md:leading-4 text-[#595959]">
                                    <li><Link href="/about" className="hover:underline">About Us</Link></li>
                                </ul>
                            </div>

                            {/* Support */}
                            <div className="flex flex-col items-start px-0 md:px-0 py-3 gap-3">
                                <h3 className="text-left text-[17px] leading-[24px] md:text-[22px] md:leading-[30px] font-medium text-[#595959]">
                                    Support
                                </h3>
                                <ul className="space-y-2 text-left text-[13px] leading-[20px] md:text-[12px] md:leading-4 text-[#595959]">
                                    <li><Link href="/faq" className="hover:underline">FAQs</Link></li>

                                    {/* Contact → 触发“Orders or appointments contact” */}
                                    <li>
                                        <a
                                            href="/chatbot?from=footer&item=contact"
                                            className="hover:underline"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                window.dispatchEvent(new CustomEvent('footerChatTrigger', { detail: { item: 'contact' }}));
                                            }}
                                        >
                                            Contact
                                        </a>
                                    </li>

                                    {/* Payment → 触发“Payment methods” */}
                                    <li>
                                        <a
                                            href="/chatbot?from=footer&item=payment"
                                            className="hover:underline"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                window.dispatchEvent(new CustomEvent('footerChatTrigger', { detail: { item: 'payment' }}));
                                            }}
                                        >
                                            Payment
                                        </a>
                                    </li>

                                    {/* Cancel & Refund → 触发“Refund requests” */}
                                    <li>
                                        <a
                                            href="/chatbot?from=footer&item=cancel-refund"
                                            className="hover:underline"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                window.dispatchEvent(new CustomEvent('footerChatTrigger', { detail: { item: 'cancel-refund' }}));
                                            }}
                                        >
                                            Cancel &amp; Refund
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            {/* Service */}
                            <div className="flex flex-col items-start px-0 md:px-0 py-3 gap-3">
                                <h3 className="text-left text-[17px] leading-[24px] md:text-[22px] md:leading-[30px] font-medium text-[#595959]">
                                    Service
                                </h3>
                                <ul className="space-y-2 text-left text-[13px] leading-[20px] md:text-[12px] md:leading-4 text-[#595959]">

                                    {/* Free Trial Session → 触发“Free Trial Session”（可选） */}
                                    <li>
                                        <a
                                            href="/chatbot?from=footer&item=free-trial"
                                            className="hover:underline"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                window.dispatchEvent(new CustomEvent('footerChatTrigger', { detail: { item: 'free-trial' }}));
                                            }}
                                        >
                                            Free Trial Session
                                        </a>
                                    </li>

                                    {/* Career Package → 触发“Career Package”（可选） */}
                                    <li>
                                        <a
                                            href="/chatbot?from=footer&item=career-package"
                                            className="hover:underline"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                window.dispatchEvent(new CustomEvent('footerChatTrigger', { detail: { item: 'career-package' }}));
                                            }}
                                        >
                                            Career Package
                                        </a>
                                    </li>

                                    {/* Become a Mentor → 触发“Apply to become a mentor” */}
                                    <li>
                                        <a
                                            href="/chatbot?from=footer&item=become-mentor"
                                            className="hover:underline"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                window.dispatchEvent(new CustomEvent('footerChatTrigger', { detail: { item: 'become-mentor' }}));
                                            }}
                                        >
                                            Become a Mentor
                                        </a>
                                    </li>
                                </ul>
                            </div>


                        </div>
                    </div>

                    {/* 分割线 */}
                    <div className="w-full">
                        <div className="h-px w-full border-t border-[rgba(0,0,0,0.06)]" />
                    </div>

                    {/* 版权 */}
                    <div className="flex w-full flex-col justify-between gap-3 py-3 md:flex-row md:items-center">
                        <p className="text-left text-[12px] md:text-[14px] leading-[20px] md:leading-[22px] text-[#8C8C8C]">
                            ©2025 MentorUp. All rights reserved
                        </p>
                        <div className="flex items-center gap-4">
                            <Link href="/privacy" className="text-[12px] md:text-[14px] leading-[20px] md:leading-[22px] text-[#8C8C8C] underline hover:opacity-80">
                                Terms of Use and Privacy Policy
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* 微信二维码弹窗 */}
            {wechatOpen && (
                <div
                    className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label="WeChat QR Modal"
                    onClick={() => setWechatOpen(false)}
                >
                    <div
                        className="w-full max-w-[340px] rounded-2xl bg-white p-5 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h4 className="text-[16px] font-medium text-[#262626]">Follow us on WeChat</h4>
                            <button
                                className="h-8 w-8 rounded-full hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-[#1890ff]"
                                aria-label="Close"
                                onClick={() => setWechatOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mt-4 flex flex-col items-center text-center">
                            <img src="/wechat-qr.png" alt="WeChat QR Code" className="w-[240px] h-[240px] rounded-md border border-black/10 object-contain" />
                            <p className="mt-3 text-sm text-[#595959]">Scan the QR code in WeChat</p>
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