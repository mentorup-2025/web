'use client';

import ResumeUpload from '@/components/ResumeUpload';

export default function ResumePage() {
    // 临时测试写死 userId，实际可以改为动态从登录状态读取
    const testUserId = '93137255-d7ac-4219-90d9-a886ae987732';

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">上传你的简历</h1>
            <ResumeUpload userId={testUserId} />
        </div>
    );
}