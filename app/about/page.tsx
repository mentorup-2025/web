// app/about/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Us — MentorUp",
    description:
        "MentorUp is a transparent mentorship platform connecting you directly with elite guidance.",
};

export default function AboutPage() {
    return (
        <main id="about" className="relative overflow-hidden bg-[#FDFDFE]">
            {/* ⭐ 背景星星装饰（20角星） */}
            <div className="absolute inset-0 pointer-events-none">
                {/* 左上角 */}
                <Star20 className="absolute top-[120px] left-[80px] w-[120px] h-[120px] opacity-30 text-[#B7D8FF]" />
                {/* 右上角 */}
                <Star20 className="absolute top-[200px] right-[100px] w-[160px] h-[160px] opacity-25 text-[#D6E8FF]" />
                {/* 左下角 */}
                <Star20 className="absolute bottom-[120px] left-[160px] w-[100px] h-[100px] opacity-20 text-[#CDE2FF]" />
                {/* 右下角 */}
                <Star20 className="absolute bottom-[80px] right-[180px] w-[180px] h-[180px] opacity-20 text-[#A6CCFF]" />
            </div>

            {/* 顶部间距与最大宽度 */}
            <section className="relative mx-auto max-w-[999px] px-6 md:px-[120px] pt-16 md:pt-[80px] pb-20">
                {/* 大标题 */}
                <h1 className="text-[40px] leading-[48px] md:text-[52px] md:leading-[64px] font-medium text-black">
                    About Us — MentorUp
                </h1>

                {/* 导语 */}
                <p className="mt-6 text-[14px] leading-[22px] text-black">
                    Many students and young professionals struggle to find trustworthy, high-quality career guidance.
                    They often don’t know who to talk to, where to start, or how to find mentors who truly understand their goals.
                    MentorUp was created to solve exactly that problem.
                </p>

                {/* Section 1 */}
                <div className="mt-12 md:mt-[88px] grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr] md:gap-[128px]">
                    <h2 className="text-[24px] leading-[32px] md:text-[30px] md:leading-[40px] font-medium text-black">
                        Stop Guessing.<br className="hidden md:block" />
                        Start Growing.
                    </h2>
                    <p className="text-[18px] leading-[26px] md:text-[20px] md:leading-[28px] text-black">
                        Tired of struggling to find trustworthy, high-quality career guidance? We created MentorUp to solve the
                        universal problem of career uncertainty. You don&apos;t have to navigate your next steps alone.
                    </p>
                </div>

                {/* Section 2 */}
                <div className="mt-12 md:mt-20 grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr] md:gap-[128px]">
                    <h2 className="text-[24px] leading-[32px] md:text-[30px] md:leading-[40px] font-medium text-black">
                        What We Are<br className="hidden md:block" />
                        Providing
                    </h2>
                    <p className="text-[18px] leading-[26px] md:text-[20px] md:leading-[28px] text-black">
                        MentorUp is the simplest, most transparent mentorship platform designed to connect you directly with elite guidance.
                    </p>
                </div>

                {/* Section 3 */}
                <div className="mt-12 md:mt-20 grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr] md:gap-[128px]">
                    <h2 className="text-[24px] leading-[32px] md:text-[30px] md:leading-[40px] font-medium text-black">
                        Who We Serve
                    </h2>
                    <p className="text-[18px] leading-[26px] md:text-[20px] md:leading-[28px] text-black">
                        Whether you&apos;re a student, a young professional, or ready for a career change, MentorUp is built for your growth.
                    </p>
                </div>
            </section>
        </main>
    );
}

/* 🎨 可重用的 20角星组件（SVG） */
function Star20({ className = "" }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            fill="currentColor"
        >
            <polygon
                points="50,5 57,35 87,13 67,43 95,50 67,57 87,87 57,65 50,95 43,65 13,87 33,57 5,50 33,43 13,13 43,35"
            />
        </svg>
    );
}