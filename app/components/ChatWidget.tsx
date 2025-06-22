"use client";

import { useState } from "react";

export default function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([{ role: "system", content: "你好！有什么我可以帮你的吗？" }]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    async function sendMessage() {
        if (!input.trim()) return;
        const userMsg = { role: "user", content: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: [...messages, userMsg] }),
        });

        const data = await res.json();
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        setLoading(false);
    }

    return (
        <>
            {/* 悬浮按钮 */}
            <button onClick={() => setOpen(!open)} className="fixed bottom-6 right-6 p-4 bg-black text-white rounded-full shadow-lg z-50">
                🤖
            </button>

            {/* 聊天窗口 */}
            {open && (
                <div className="fixed bottom-20 right-6 w-80 h-[500px] bg-white shadow-2xl rounded-xl z-50 flex flex-col">
                    <div className="flex-1 p-4 overflow-y-auto">
                        {messages.map((msg, i) => (
                            <div key={i} className={`mb-2 text-sm ${msg.role === "user" ? "text-right" : "text-left"}`}>
                <span className={msg.role === "user" ? "bg-blue-100 px-2 py-1 rounded" : "bg-gray-100 px-2 py-1 rounded"}>
                  {msg.content}
                </span>
                            </div>
                        ))}
                        {loading && <div className="text-gray-400 text-sm">AI generating...</div>}
                    </div>
                    <div className="p-2 border-t flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="flex-1 p-2 border rounded"
                            placeholder="请输入问题"
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        />
                        <button onClick={sendMessage} className="bg-blue-500 text-white px-4 rounded">发送</button>
                    </div>
                </div>
            )}
        </>
    );
}
