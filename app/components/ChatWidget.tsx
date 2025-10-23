"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";

const SUGGESTIONS = [
    "Apply to become a mentor",
    "Payment methods",
    "Update account details",
    "Orders or appointments contact",
    "Refund requests",
];

const REPLIES: Record<string, string> = {
    "Apply to become a mentor":
        "Click the “Become a Mentor” button at the top-right corner and submit your application. We’ll review it internally and let you know within 1 business day.",
    "Payment methods":
        "Currently, we accept all major credit cards and PayPal. Support for WeChat Pay is coming soon.",
    "Update account details":
        "To update your account details, please email us using the template below:\n\n" +
        "#Your Name:\n" +
        "#Email Address:\n" +
        "#Details you want to update:",
};

function SuggestionButtons({ onSelect }: { onSelect: (msg: string) => void }) {
    return (
        <div className="mt-4 flex flex-col items-end space-y-3">
            {SUGGESTIONS.map((suggestion) => (
                <button
                    key={suggestion}
                    onClick={() => onSelect(suggestion)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md text-[14px] text-black transition-all"
                >
                    {suggestion}
                </button>
            ))}
        </div>
    );
}

function GuestChatContent({
                              messages,
                              onSelect,
                              isMentor,
                          }: {
    messages: { role: string; content: string }[];
    onSelect: (msg: string) => void;
    isMentor: boolean;
}) {
    // 底部锚点（未登录视图）
    const endRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [messages]);

    return (
        <div
            className={`
        fixed right-6 w-80 h-[500px] bg-white shadow-2xl rounded-xl
        z-[9999] flex flex-col text-[14px]
        ${isMentor ? "bottom-40 md:bottom-28" : "bottom-20"}
      `}
        >
            <div className="flex-1 p-4 overflow-y-auto space-y-2">
                {messages.map((msg, i) => (
                    <div key={i}>
                        <div
                            className={`${
                                msg.role === "user" ? "text-right" : "text-left ml-2 mr-auto"
                            }`}
                        >
              <span
                  className={`inline-block max-w-[75%] px-3 py-2 rounded-2xl ${
                      msg.role === "user" ? "bg-blue-100" : "bg-blue-200"
                  } text-black text-[13px]`}
              >
                <pre className="whitespace-pre-wrap font-sans">
                  {msg.content}
                </pre>
              </span>
                        </div>
                        {msg.role === "system" && <SuggestionButtons onSelect={onSelect} />}
                    </div>
                ))}
                {/* 底部锚点 */}
                <div ref={endRef} />
            </div>
            <div className="p-3 text-[12px] text-gray-500 text-center">
                Still have questions?{" "}
                <a href="mailto:contactus@mentorup.info" className="text-blue-500 underline">
                    Send us an email
                </a>
            </div>
        </div>
    );
}

export default function ChatWidget() {
    const pathname = usePathname();
    const { isLoaded, isSignedIn, user } = useUser();
    const path = pathname ?? "";
    const isMentor: boolean = path === "/mentor" || path.startsWith("/mentor/");
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: "system", content: "What could we help you with?" },
    ]);
    const [input, setInput] = useState("");
    const [expectingEmailType, setExpectingEmailType] = useState<null | "refund" | "order">(null);

    // 底部锚点（登录视图）
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // 使用useCallback包装handleUserInput函数
    const handleUserInput = useCallback((content: string) => {
        const userMsg = { role: "user", content };
        let botReplyContent = "（这是一个默认回复）";

        // [ADDED] 为Footer特定项目设置专门回复
        if (content === "I have a question about contacting support") {
            botReplyContent = "For general inquiries, please email us at contactus@mentorup.info. For urgent matters, you can also reach us through this chat during business hours (9 AM - 6 PM EST).";
        } else if (content === "Payment methods") {
            botReplyContent = "We currently accept major credit/debit cards and PayPal. WeChat Pay support is coming soon.";
        } else if (content === "Refund requests") {
            botReplyContent = "To request a refund, please provide the following details:\n\n" +
                "# Your Name:\n" +
                "# Email used for booking:\n" +
                "# Session details (date, mentor name):\n" +
                "# Reason for refund:\n\n" +
                "We typically process refunds within 3-5 business days.";
        } else if (content === "Free Trial Session") {
            botReplyContent = "We offer a 15-minute Free Trial Session that you can book with any mentor who provides free coffee chats. Each member receives one free trial.";
        } else if (content === "Career Package") {
            botReplyContent = "Our career packages include:\n\n" +
                "🎯 **Starter Package** (4 sessions): Basic career guidance\n" +
                "🚀 **Growth Package** (8 sessions): Comprehensive career development\n" +
                "💫 **Elite Package** (12 sessions): Full career transformation\n\n" +
                "Which area are you looking to focus on?";
        } else if (content === "Apply to become a mentor") {
            botReplyContent = "To apply as a mentor, simply click the \"Become a Mentor\" button (top right corner) and fill out the application form.";
        } else if (content === "Orders or appointments contact") {
            setExpectingEmailType(null);
            botReplyContent = "To help you with your order or appointment, please email us using the template below:\n\n" +
                "# Your Name:\n" +
                "# Email used for booking:\n" +
                "# Question or Issue:";
        } else {
            setExpectingEmailType(null);
            botReplyContent = REPLIES[content] || botReplyContent;
        }

        const botReply = {
            role: "assistant",
            content: botReplyContent,
        };

        const followUp = {
            role: "system",
            content: "Anything else we can help you with?",
        };

        setMessages((prev) => [...prev, userMsg, botReply, followUp]);
    }, []);

    // 每次消息有变化或面板刚打开时，滚动到底部
    useEffect(() => {
        if (!open) return;
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [messages, open]);

    // 事件监听器
    useEffect(() => {
        const handleFooterChatTrigger = (event: CustomEvent) => {
            const { item } = event.detail;
            setOpen(true); // 打开聊天窗口

            // 根据不同的item设置初始消息
            let initialMessage = "";
            switch (item) {
                case 'contact':
                    initialMessage = "I have a question about contacting support";
                    break;
                case 'payment':
                    initialMessage = "Payment methods";
                    break;
                case 'cancel-refund':
                    initialMessage = "Refund requests";
                    break;
                case 'free-trial':
                    initialMessage = "Free Trial Session";
                    break;
                case 'career-package':
                    initialMessage = "Career Package";
                    break;
                case 'become-mentor':
                    initialMessage = "Apply to become a mentor";
                    break;
                default:
                    initialMessage = "I need help";
            }

            // 延迟发送消息以确保聊天窗口已打开
            setTimeout(() => {
                handleUserInput(initialMessage);
            }, 100);
        };

        // 添加事件监听器
        window.addEventListener('footerChatTrigger', handleFooterChatTrigger as EventListener);

        // 清理函数
        return () => {
            window.removeEventListener('footerChatTrigger', handleFooterChatTrigger as EventListener);
        };
    }, [handleUserInput]); // 添加handleUserInput到依赖数组

    // 条件返回必须在所有hook之后
    if (!isLoaded) return null;

    async function sendEmailTemplate(email: string, type: "refund" | "order") {
        const emailType = type === "refund" ? "RefundProcessedEmail" : "OrderContactEmail";

        await fetch("/api/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                from: "contactus@mentorup.info",
                to: email,
                type: emailType,
                message: {
                    userName: email,
                    refundAmount: "$25",
                    sessionTitle: "Intro Call",
                },
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
            { role: "system", content: "Anything else we can help you with?" },
        ]);

        setExpectingEmailType(null);
        setInput("");
    }

    function sendMessage() {
        if (!input.trim() && !expectingEmailType) return;

        if (expectingEmailType) {
            const email = user?.primaryEmailAddress?.emailAddress || "";
            sendEmailTemplate(email, expectingEmailType);
        } else {
            handleUserInput(input);
        }

        setInput("");
    }

    return (
        <>
            <button
                onClick={() => setOpen(!open)}
                className={`
          fixed right-6 w-16 h-16 bg-blue-500 text-white rounded-full shadow-lg
          flex items-center justify-center
          z-[9999]
          ${isMentor ? "bottom-28 md:bottom-6" : "bottom-6"}
        `}
            >
                <img src="/chat-icon.png" alt="Chat" className="w-8 h-8" />
            </button>

            {open &&
                (isSignedIn ? (
                    <div
                        className={`
              fixed right-6 w-80 h-[500px] bg-white shadow-2xl rounded-xl
              z-[9999] flex flex-col text-[13px]
              ${isMentor ? "bottom-40 md:bottom-28" : "bottom-20"}
            `}
                    >
                        <div className="flex-1 p-4 overflow-y-auto space-y-2">
                            {messages.map((msg, i) => (
                                <div key={i}>
                                    {msg.role === "user" ? (
                                        <div className="text-right">
                      <span className="inline-block max-w-[80%] px-3 py-2 rounded-2xl bg-blue-100 text-black text-[13px]">
                        <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                      </span>
                                        </div>
                                    ) : (
                                        <div className="text-left ml-2 mr-auto">
                      <span className="inline-block max-w-[75%] px-3 py-2 rounded-2xl bg-blue-200 text-black text-[13px]">
                        <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                      </span>
                                        </div>
                                    )}
                                    {(i === 0 || (msg.role === "system" && i !== 0)) && (
                                        <SuggestionButtons onSelect={handleUserInput} />
                                    )}
                                </div>
                            ))}
                            {/* 登录视图的底部锚点 */}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-3 text-[12px] text-gray-500 text-center">
                            Still have questions?{" "}
                            <a href="mailto:contactus@mentorup.info" className="text-blue-500 underline">
                                Send us an email
                            </a>
                        </div>
                    </div>
                ) : (
                    <GuestChatContent
                        messages={messages}
                        onSelect={handleUserInput}
                        isMentor={isMentor}
                    />
                ))}
        </>
    );
}