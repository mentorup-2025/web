// components/Footer.tsx
import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-[#E6F7FF] text-black">
            {/* 外层容器 */}
            <div className="mx-auto w-full max-w-[1280px] px-[120px] py-[20px]">
                <div className="flex flex-col gap-[10px]">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start md:gap-[200px] py-[20px]">
                        {/* 品牌部分 */}
                        <div className="w-full md:w-[305px] flex flex-col gap-[20px]">
                            <div className="flex flex-col gap-[12px]">
                                <div className="text-[38px] leading-[46px] font-medium text-[#096DD9]">
                                    MentorUp
                                </div>
                                <p className="text-[14px] leading-[22px] text-black whitespace-nowrap">
                                    Level up your career with personalized mentors
                                </p>

                                {/* ✅ 社交图标区域 */}
                                <div className="mt-2 flex items-center gap-[20px]">
                                    {/* LinkedIn */}
                                    <Link
                                        href="https://www.linkedin.com"
                                        aria-label="LinkedIn"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="LinkedIn"
                                    >
                                        <img
                                            src="/linkedin-footer.png"
                                            alt="LinkedIn"
                                            className="h-[22px] w-[22px] object-contain hover:opacity-80 transition"
                                        />
                                    </Link>

                                    {/* Xiaohongshu */}
                                    <Link
                                        href="https://www.xiaohongshu.com"
                                        aria-label="Xiaohongshu"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Xiaohongshu"
                                    >
                                        <img
                                            src="/xiaohongshu.png"
                                            alt="Xiaohongshu"
                                            className="h-[22px] w-[22px] object-contain hover:opacity-80 transition"
                                        />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* 三列导航 */}
                        <div className="mt-[28px] grid w-full max-w-[478px] grid-cols-3 gap-[28px] md:mt-0">
                            {/* About */}
                            <div className="flex flex-col items-start px-[20px] py-[16px] gap-[16px]">
                                <h3 className="text-[24px] leading-[32px] font-medium text-[#595959]">About</h3>
                                <ul className="space-y-[10px] text-[12px] leading-4 text-[#595959]">
                                    <li><Link href="/about" className="hover:underline">About Us</Link></li>
                                </ul>
                            </div>

                            {/* Support */}
                            <div className="flex flex-col items-start px-[20px] py-[16px] gap-[16px]">
                                <h3 className="text-[24px] leading-[32px] font-medium text-[#595959]">Support</h3>
                                <ul className="space-y-[10px] text-[12px] leading-4 text-[#595959]">
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
                            <div className="flex flex-col items-start px-[20px] py-[16px] gap-[16px]">
                                <h3 className="text-[24px] leading-[32px] font-medium text-[#595959]">Service</h3>
                                <ul className="space-y-[10px] text-[12px] leading-4 text-[#595959]">
                                    <li><Link href="/chatbot?from=footer&item=free-trial" className="hover:underline">Free Trial Session</Link></li>
                                    <li><Link href="/chatbot?from=footer&item=career-package" className="hover:underline">Career Package</Link></li>
                                    <li><Link href="/chatbot?from=footer&item=become-mentor" className="hover:underline">Become a Mentor</Link></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* 分割线 */}
                    <div className="ml-0 w-full">
                        <div className="mx-0 h-px w-[979px] border-t border-[rgba(0,0,0,0.06)]" />
                    </div>

                    {/* 底部版权 */}
                    <div className="flex w-[979px] flex-col justify-between gap-[12px] py-[12px] md:flex-row">
                        <p className="text-[14px] leading-[22px] text-[#8C8C8C]">
                            ©2025 MentorUp. All rights reserved
                        </p>
                        <div className="flex items-center gap-[16px]">
                            <Link href="/privacy" className="text-[14px] leading-[22px] text-[#8C8C8C] underline hover:opacity-80">
                                Privacy Policy
                            </Link>
                            <Link href="/terms" className="text-[14px] leading-[22px] text-[#8C8C8C] underline hover:opacity-80">
                                Terms of Use
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}