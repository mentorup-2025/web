'use client';
import { usePathname } from 'next/navigation';
import Footer from './Footer';

const SHOW_PATHS = new Set<string>(['/', '/mentor-list', '/about']); // 示例

export default function FooterClient() {
    const pathname = usePathname();            // string | null
    if (!pathname || !SHOW_PATHS.has(pathname)) return null;  // 先判空
    return <Footer />;
}