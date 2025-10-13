"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

const SHOW_PATHS = new Set<string>(["/", "/mentor-list"]);

export default function FooterClient() {
    const pathname = usePathname();
    if (!SHOW_PATHS.has(pathname)) return null;
    return <Footer />;
}