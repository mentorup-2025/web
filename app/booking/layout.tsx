'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BookingLayout({
                                          children,
                                      }: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // 判断是否是支付页
    const isPaymentPage = pathname?.startsWith('/booking/payment');

    // 控制内容区域样式（支付页不设宽度限制，也不加 padding）
    const contentClass = isPaymentPage
        ? 'w-full' // 全屏显示，无边距
        : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'; // 普通页面样式

    return (
        <div className="min-h-screen bg-white"> {/* ✅ 设置全白背景 */}
            {/* ✅ 非支付页显示顶部导航栏 */}
            {!isPaymentPage && (
                <nav className="bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex gap-6 h-14 items-center">
                            <Link
                                href="/booking/calendar"
                                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                                    pathname === '/booking/calendar' ? 'text-blue-600' : 'text-gray-600'
                                }`}
                            >
                                Calendar
                            </Link>
                            <Link
                                href="/booking/slots"
                                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                                    pathname === '/booking/slots' ? 'text-blue-600' : 'text-gray-600'
                                }`}
                            >
                                Time Slots
                            </Link>
                        </div>
                    </div>
                </nav>
            )}

            {/* ✅ 内容区域，支付页使用 w-full，不加边距 */}
            <main className={contentClass}>
                {children}
            </main>
        </div>
    );
}
