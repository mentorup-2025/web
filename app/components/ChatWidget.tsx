"use client";

import { useState } from "react";

export default function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: "system", content: "你好！欢迎使用聊天窗口。" },
    ]);
    const [input, setInput] = useState("");

    function sendMessage() {
        if (!input.trim()) return;
        const userMsg = { role: "user", content: input };
        const botReply = {
            role: "assistant",
            content: "（这是一个示例回复，AI 未接入）",
        };

        setMessages((prev) => [...prev, userMsg, botReply]);
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
                    <div className="flex-1 p-4 overflow-y-auto">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`mb-2 text-sm ${
                                    msg.role === "user" ? "text-right" : "text-left"
                                }`}
                            >
                <span
                    className={`inline-block px-2 py-1 rounded ${
                        msg.role === "user"
                            ? "bg-blue-100 text-black"
                            : "bg-gray-100 text-black"
                    }`}
                >
                  {msg.content}
                </span>
                            </div>
                        ))}
                    </div>

                    <div className="p-2 border-t flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="flex-1 p-2 border rounded"
                            placeholder="请输入问题"
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        />
                        <button
                            onClick={sendMessage}
                            className="bg-blue-500 text-white px-4 rounded"
                        >
                            发送
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
