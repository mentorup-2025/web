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
        "Please enter your email below and click Email so we can follow up.",
    "Refund requests":
        "Please enter your email below and click Email to receive refund confirmation.",
};

export default function ChatWidget() {
    const pathname = usePathname();
    const { isSignedIn } = useAuth();

    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: "system", content: "What could we help you with?" },
    ]);
    const [input, setInput] = useState("");
    const [expectingEmailType, setExpectingEmailType] = useState<null | "refund" | "order">(null);

    if (pathname === "/" || !isSignedIn) return null;

    async function sendEmailTemplate(email: string, type: "refund" | "order") {
        await fetch("/api/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type,
                email,
            }),
        });
        setMessages((prev) => [
            ...prev,
            { role: "user", content: email },
            {
                role: "assistant",
                content:
                    type === "refund"
                        ? "Your refund email has been sent. Please check your inbox."
                        : "We've sent a confirmation email regarding your order/appointment.",
            },
        ]);
        setExpectingEmailType(null); // 重置状态
        setInput("");
    }

    function handleUserInput(content: string) {
        const userMsg = { role: "user", content };

        // 设置邮箱输入状态
        if (content === "Refund requests") {
            setExpectingEmailType("refund");
        } else if (content === "Orders or appointments contact") {
            setExpectingEmailType("order");
        } else {
            setExpectingEmailType(null);
        }

        const botReply = {
            role: "assistant",
            content: REPLIES[content] || "（这是一个默认回复）",
        };
        setMessages((prev) => [...prev, userMsg, botReply]);
    }

    function sendMessage() {
        if (!input.trim()) return;

        // 如果此时期待用户输入邮箱
        if (expectingEmailType) {
            const email = input.trim();
            if (!email.includes("@")) {
                setMessages((prev) => [
                    ...prev,
                    { role: "user", content: email },
                    {
                        role: "assistant",
                        content: "Please enter a valid email address.",
                    },
                ]);
                setInput("");
                return;
            }
            sendEmailTemplate(email, expectingEmailType);
        } else {
            handleUserInput(input);
            setInput("");
        }
    }

    return (
        <>
            <button
                onClick={() => setOpen(!open)}
                className="fixed bottom-6 right-6 w-16 h-16 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center z-50"
            >
                <img src="/chat-icon.png" alt="Chat" className="w-8 h-8" />
            </button>

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

                    {/* 输入 + Email 按钮 */}
                    <div className="p-2 border-t flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="flex-1 p-2 border rounded text-sm"
                            placeholder={
                                expectingEmailType ? "Please enter your email..." : "Still have questions?"
                            }
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
