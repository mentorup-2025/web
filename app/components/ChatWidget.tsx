"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

const SUGGESTIONS = [
    "Apply to become a mentor",
    "Payment methods",
    "Update account details",
    "Orders or appointments contact",
    "Refund requests",
];

const REPLIES: Record<string, string> = {
    "Apply to become a mentor":
        "You can apply through your dashboard under the 'Mentor Program' tab.",
    "Payment methods":
        "We currently support credit/debit cards, PayPal, and bank transfers.",
    "Update account details":
        "Navigate to your profile settings to update personal information.",
    "Orders or appointments contact":
        "Please check your order history or contact us via support.",
    "Refund requests":
        "Submit a refund request within 7 days of your order from the order page.",
};

export default function ChatWidget() {
    const pathname = usePathname();
    const { isSignedIn } = useAuth();

    // ✅ 所有 hooks 须写在组件顶层
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: "system", content: "What could we help you with?" },
    ]);
    const [input, setInput] = useState("");

    // ✅ 条件判断放在 hooks 初始化之后
    if (pathname === "/" || !isSignedIn) return null;

    function handleUserInput(content: string) {
        const userMsg = { role: "user", content };
        const botReply = {
            role: "assistant",
            content: REPLIES[content] || "（这是一个默认回复）",
        };
        setMessages((prev) => [...prev, userMsg, botReply]);
    }

    function sendMessage() {
        if (!input.trim()) return;
        handleUserInput(input);
        setInput("");
    }

    return (
        <>
            {/* 悬浮按钮 */}
            <button
                onClick={() => setOpen(!open)}
                className="fixed bottom-6 right-6 w-16 h-16 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center z-50"
            >
                <img src="/chat-icon.png" alt="Chat" className="w-8 h-8" />
            </button>

            {/* 聊天窗口 */}
            {open && (
                <div className="fixed bottom-20 right-6 w-80 h-[500px] bg-white shadow-2xl rounded-xl z-50 flex flex-col">
                    <div className="flex-1 p-4 overflow-y-auto space-y-2">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`text-sm ${
                                    msg.role === "user" ? "text-right" : "text-left"
                                }`}
                            >
                <span
                    className={`inline-block px-3 py-2 rounded-2xl ${
                        msg.role === "user"
                            ? "bg-blue-100 text-black"
                            : "bg-blue-200 text-black"
                    }`}
                >
                  {msg.content}
                </span>

                                {/* 如果是系统第一条消息，展示建议按钮 */}
                                {i === 0 && (
                                    <div className="mt-4 flex flex-col items-end space-y-2">
                                        {SUGGESTIONS.map((suggestion) => (
                                            <button
                                                key={suggestion}
                                                onClick={() => handleUserInput(suggestion)}
                                                className="px-4 py-2 border border-gray-300 rounded-full shadow-sm hover:shadow-md text-sm text-black text-left"
                                            >
                                                <u>{suggestion}</u>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* 输入区域 */}
                    <div className="p-2 border-t flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="flex-1 p-2 border rounded text-sm"
                            placeholder="Still have questions?"
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        />
                        <button
                            onClick={sendMessage}
                            className="bg-blue-500 text-white px-3 flex items-center gap-1 rounded"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M2.94 2.94a1.5 1.5 0 012.12 0l12 12a1.5 1.5 0 01-2.12 2.12l-1.44-1.44-2.88 2.88a1 1 0 01-1.67-.75v-4.25a1 1 0 00-1-1H3a1 1 0 01-.75-1.67l2.88-2.88-1.44-1.44a1.5 1.5 0 010-2.12z" />
                            </svg>
                            Email
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
