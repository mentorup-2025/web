"use client";

import { useState } from "react";
import {
    Calendar,
    Tag,
    Modal,
    Input,
    message,
    Button,
    Avatar,
} from "antd";
import {
    SearchOutlined,
    LinkedinFilled,
    GithubFilled,
    EditOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

/**
 * Mentor profile page – pixel–matched to provided mock‑up.
 *
 * Tailwind CSS is used for layout / styling, while Ant Design powers interactive
 * components such as <Calendar />, <Tag/>, <Modal/>, and <Button />.  Everything
 * is entirely client‑side so the file can live inside `app/(pages)/` in a Next.js
 * project.
 */
export default function MentorProfilePage() {
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isEditingCompany, setIsEditingCompany] = useState(false);
    const [companyName, setCompanyName] = useState("");

    const timeSlots = ["4-5 PM", "4-5 PM", "4-5 PM"];

    const handleSchedule = () => {
        if (!selectedDate || !selectedTime) {
            message.warning("Please select a date and time first.");
            return;
        }
        setIsScheduleModalOpen(true);
    };

    return (
        <div className="min-h-screen flex flex-col bg-white font-sans text-gray-900">
            {/* ░░ TOP BAR ░░ */}
            <header className="w-full bg-black text-white flex items-center justify-between h-14 px-5">
                {/* left – logo + search */}
                <div className="flex items-center space-x-4 w-1/2 max-w-[540px]">
                    <span className="text-2xl font-bold leading-none select-none">Logo</span>
                    <div className="relative flex-1">
                        <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search"
                            className="w-full h-8 pl-9 pr-2 rounded bg-[#e5e5e5] text-sm text-gray-900 placeholder-gray-500 focus:outline-none"
                        />
                    </div>
                </div>
                {/* right – cta + login */}
                <div className="flex items-center space-x-6">
                    <Button
                        type="primary"
                        className="bg-[#1e9bf0] hover:bg-[#1288d8] border-none h-8 px-3 rounded-lg text-sm font-semibold shadow-none"
                    >
                        Become a mentor
                    </Button>
                    <Avatar
                        size={32}
                        className="bg-[#d9d9d9] flex items-center justify-center text-gray-700"
                    />
                </div>
            </header>

            {/* ░░ MAIN AREA ░░ */}
            <main className="flex flex-1">
                {/* LEFT SIDEBAR */}
                <aside className="w-64 bg-[#cdcdcd] flex flex-col items-center pt-8 pb-6 space-y-6">
                    {/* avatar */}
                    <Avatar size={88} className="bg-gray-400" />

                    {/* social icons */}
                    <div className="flex space-x-3">
                        <a className="w-7 h-7 flex items-center justify-center rounded bg-white text-[#0a66c2] shadow-sm">
                            <LinkedinFilled />
                        </a>
                        <a className="w-7 h-7 flex items-center justify-center rounded bg-white text-black shadow-sm">
                            <GithubFilled />
                        </a>
                    </div>

                    {/* name & title */}
                    <div className="text-center space-y-0.5">
                        <h2 className="text-lg font-semibold leading-tight">Name Name</h2>
                        <p className="text-sm">Job Title title</p>
                    </div>

                    {/* meta fields */}
                    <dl className="w-full px-6 space-y-4 text-sm mt-4">
                        {/* company row – editable */}
                        <div className="flex items-start justify-between">
                            <dt className="font-medium">Company:</dt>
                            <dd className="text-right max-w-[9rem]">
                                {isEditingCompany ? (
                                    <Input
                                        size="small"
                                        autoFocus
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        onBlur={() => setIsEditingCompany(false)}
                                        onPressEnter={() => setIsEditingCompany(false)}
                                    />
                                ) : (
                                    <span>{companyName || ""}</span>
                                )}
                            </dd>
                            <button
                                title="Edit company"
                                onClick={() => setIsEditingCompany(true)}
                                className="ml-1 text-gray-800 hover:text-black"
                            >
                                <EditOutlined />
                            </button>
                        </div>
                        {/* static rows */}
                        <div className="flex justify-between">
                            <dt className="font-medium">Industry:</dt>
                            <dd className="text-right text-gray-700">–</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="font-medium">YoE:</dt>
                            <dd className="text-right text-gray-700">–</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="font-medium">Language:</dt>
                            <dd className="text-right text-gray-700">–</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="font-medium">Gender:</dt>
                            <dd className="text-right text-gray-700">–</dd>
                        </div>
                    </dl>
                </aside>

                {/* CENTER CONTENT */}
                <section className="flex-1 px-8 py-8 space-y-8 overflow-y-auto bg-white">
                    {/* About */}
                    <div className="bg-[#e5e5e5] rounded p-6 min-h-[160px]">
                        <h3 className="text-xl font-semibold mb-4">About</h3>
                        {/* placeholder content */}
                    </div>

                    {/* Services */}
                    <div className="bg-[#e5e5e5] rounded p-6">
                        <h3 className="text-xl font-semibold mb-4">Services</h3>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <Tag closable key={i} className="flex justify-center items-center px-3 py-1">
                                    Tag {((i % 3) + 1).toString()}
                                </Tag>
                            ))}
                        </div>
                    </div>

                    {/* Experience */}
                    <div className="bg-transparent border-2 border-dashed border-gray-400 rounded p-6 min-h-[200px]">
                        <h3 className="text-xl font-semibold">Experience</h3>
                    </div>
                </section>

                {/* RIGHT SIDEBAR */}
                <aside className="w-72 px-6 py-8 space-y-6 bg-white">
                    {/* calendar wrapper so header matches mock‑up */}
                    <div className="rounded overflow-hidden shadow-sm">
                        <Calendar
                            fullscreen={false}
                            value={selectedDate || dayjs("2025-03-17")}
                            onSelect={(date) => setSelectedDate(date)}
                            headerRender={({ value, onChange }) => {
                                const month = value.format("MMMM");
                                const year = value.year();
                                return (
                                    <div className="flex items-center justify-between px-4 py-2 bg-white border-b">
                                        <div className="flex items-center space-x-2">
                                            <select
                                                value={year}
                                                onChange={(e) => onChange(value.year(Number(e.target.value)))}
                                                className="border rounded px-2 h-7 text-sm focus:outline-none"
                                            >
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <option value={2023 + i} key={i}>
                                                        {2023 + i}
                                                    </option>
                                                ))}
                                            </select>
                                            <select
                                                value={month}
                                                onChange={(e) => {
                                                    const monthIndex = dayjs()
                                                        .month(e.target.value)
                                                        .month();
                                                    onChange(value.month(monthIndex));
                                                }}
                                                className="border rounded px-2 h-7 text-sm focus:outline-none"
                                            >
                                                {dayjs.months().map((m) => (
                                                    <option value={m} key={m}>
                                                        {m}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                );
                            }}
                        />
                    </div>

                    {/* time slots */}
                    <div className="space-y-2">
                        {timeSlots.map((slot, i) => (
                            <Button
                                key={i}
                                type={selectedTime === slot ? "primary" : "default"}
                                onClick={() => setSelectedTime(slot)}
                                className="!flex !justify-center !items-center !h-10 !rounded-md !px-0 !shadow-none"
                            >
                                <span>{slot}</span>
                                <span className="ml-2 text-green-500">●</span>
                            </Button>
                        ))}
                    </div>

                    {/* price */}
                    <p className="text-[#1e9bf0] font-semibold text-lg">$30/h</p>

                    {/* schedule button */}
                    <Button
                        block
                        onClick={handleSchedule}
                        className="bg-[#3d3d3d] hover:bg-black border-none h-10 text-white rounded-md"
                    >
                        Schedule
                    </Button>
                </aside>
            </main>

            {/* ░░ CONFIRMATION MODAL ░░ */}
            <Modal
                title="Confirm Schedule"
                open={isScheduleModalOpen}
                onOk={() => {
                    setIsScheduleModalOpen(false);
                    message.success("Scheduled successfully!");
                }}
                onCancel={() => setIsScheduleModalOpen(false)}
                okText="Confirm"
            >
                <p className="mb-1">You selected:</p>
                <p className="font-semibold">
                    {selectedDate ? selectedDate.format("YYYY-MM-DD") : ""} at {selectedTime}
                </p>
            </Modal>
        </div>
    );
}
