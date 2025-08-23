'use client';

import { useMemo, useState } from 'react';
import {
    Card,
    Typography,
    Tag,
    Row,
    Col,
    Avatar,
    Space,
    Button,
    Modal,
    Input,
    Radio,
    message,
} from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useUser } from '@clerk/nextjs';

const { Text, Title } = Typography;

type Review = {
    id: string;
    name: string;
    rating: number;
    date: string; // ISO
    content: string;
};

const TAGS = [
    'Interview Prep',
    'System Design',
    'Career Advice',
    'Resume Review',
    'Coding Practice',
    'Behavioral',
    'Mock Interview',
    'Algorithms',
    'Work-Life Balance',
];

const DUMMY_REVIEWS: Review[] = [
    {
        id: 'r1',
        name: 'Alice Chen',
        rating: 5.0,
        date: '2025-08-01',
        content:
            'Alice was incredibly helpful in walking me through behavioral interview prep. She gave very specific examples of STAR method answers and pointed out where my stories lacked impact.',
    },
    {
        id: 'r2',
        name: 'Michael Lee',
        rating: 4.7,
        date: '2025-08-03',
        content:
            'Alice helped me debug my approach to dynamic programming problems. He patiently explained the “state, choice, definition, transition” framework and it finally clicked.',
    },
    {
        id: 'r3',
        name: 'Sofia Rodriguez',
        rating: 4.9,
        date: '2025-08-05',
        content:
            'We did a mock system design interview on designing a URL shortener. Sofia gave clear feedback on scalability tradeoffs, database choices, and how to structure my answer step by step.',
    },
    {
        id: 'r4',
        name: 'David Kim',
        rating: 4.8,
        date: '2025-08-07',
        content:
            'David reviewed my resume and suggested quantifying my project impacts (e.g., “improved latency by 30%”). Those small tweaks made my resume stand out much more.',
    },
    {
        id: 'r5',
        name: 'Emily Zhang',
        rating: 4.6,
        date: '2025-08-10',
        content:
            'Alice gave me a mock coding interview in Java. She emphasized writing clean code, naming variables clearly, and thinking out loud. It really simulated a real interview environment.',
    },
    {
        id: 'r6',
        name: 'James Patel',
        rating: 4.9,
        date: '2025-08-12',
        content:
            'Alice shared his experience transitioning from a startup to a big tech company. His career advice was practical, especially about building depth in one area before rotating roles.',
    },
];

// emoji 评分
const EMOJIS = [
    { value: 1, label: '😡' },
    { value: 2, label: '😟' },
    { value: 3, label: '😐' },
    { value: 4, label: '😊' },
    { value: 5, label: '😄' },
];

export default function MentorReviews({ mentorId }: { mentorId?: string }) {
    const { user, isSignedIn } = useUser();
    const menteeId = user?.id; // reviewer

    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [isThanksOpen, setIsThanksOpen] = useState(false);
    const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [feedbackLoading, setFeedbackLoading] = useState(false);

    const ratingAvg = 4.8;
    const total = 132;

    const filtered = useMemo(() => {
        if (!activeTag) return DUMMY_REVIEWS;
        // demo：如需按标签过滤，请给每条 review 增加 tags 字段后在这里真正过滤
        return DUMMY_REVIEWS.slice(0, 6);
    }, [activeTag]);

    const openWrite = () => {
        if (!mentorId) {
            message.warning('No mentor selected.');
            return;
        }
        if (!isSignedIn) {
            message.info('Please sign in to write a review.');
            return;
        }
        setFeedbackComment('');
        setFeedbackRating(null);
        setIsFeedbackOpen(true);
    };

    const submitReview = async () => {
        if (!mentorId || !menteeId) return;
        try {
            setFeedbackLoading(true);
            // 如果你的后端也接收 rating，可把 rating 一起发过去
            const res = await fetch('/api/reviews/insert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reviewee: mentorId,           // 被评对象：导师
                    reviewer: menteeId,           // 评论人：当前用户
                    content: feedbackComment.trim(),
                    // rating: feedbackRating,    // ← 后端支持再放开
                }),
            });
            const data = await res.json().catch(() => ({} as any));
            if (!res.ok) throw new Error(data?.message || 'Submit failed');

            setIsFeedbackOpen(false);
            setIsThanksOpen(true);
            setFeedbackComment('');
            // 可选：这里把新评论插入本地列表，立即显示
            // setLocalReviews(prev => [{ id: nanoid(), name: user?.fullName ?? 'You', rating: feedbackRating ?? 5, date: dayjs().format('YYYY-MM-DD'), content: feedbackComment.trim() }, ...prev]);
        } catch (e: any) {
            message.error(e?.message || 'Failed to submit review');
        } finally {
            setFeedbackLoading(false);
        }
    };

    return (
        <div style={{ width: '100%' }}>
            {/* 顶部统计 + Write a review */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    justifyContent: 'space-between',
                    marginBottom: 16,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <Text style={{ fontSize: 28, fontWeight: 700 }}>{ratingAvg}</Text>
                    <Text style={{ fontSize: 28 }}>/5</Text>
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                        ({total} reviews)
                    </Text>
                </div>

                <Button
                    type="link"
                    icon={<MessageOutlined />}
                    onClick={openWrite}
                    style={{ fontSize: 16, paddingRight: 0 }}
                >
                    Write a review
                </Button>
            </div>

            {/* 过滤标签 */}
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 16,
                    marginBottom: 16,
                }}
            >
                {TAGS.map((t, i) => (
                    <Tag
                        key={i}
                        style={{
                            padding: '6px 14px',
                            fontSize: 14,
                            background: '#fff',
                            borderColor: '#d9d9d9',
                            cursor: 'pointer',
                        }}
                        color={activeTag === t ? 'blue' : undefined}
                        onClick={() => setActiveTag(activeTag === t ? null : t)}
                    >
                        {t}
                    </Tag>
                ))}
            </div>

            {/* 两列卡片 */}
            <Row gutter={[24, 24]}>
                {filtered.map((r) => (
                    <Col key={r.id} xs={24} md={12}>
                        <Card
                            bodyStyle={{ padding: 16 }}
                            style={{
                                borderRadius: 8,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            }}
                        >
                            {/* 头部：头像 名称 评分 日期 */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 12,
                                }}
                            >
                                <Space>
                                    <Avatar size={28} style={{ background: '#eee' }} />
                                    <Text strong>{r.name}</Text>
                                    <Text strong style={{ marginLeft: 4 }}>
                                        {r.rating.toFixed(1)}
                                    </Text>
                                    <Text type="secondary">/5</Text>
                                </Space>

                                <Text type="secondary">
                                    {dayjs(r.date).format('MMM Do, YYYY')}
                                </Text>
                            </div>

                            {/* 内容 */}
                            <Text style={{ color: 'rgba(0,0,0,0.65)', whiteSpace: 'pre-wrap' }}>
                                {r.content}
                            </Text>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* —— Write a review 弹窗 —— */}
            <Modal
                title="Share Your Feedback"
                open={isFeedbackOpen}
                onCancel={() => setIsFeedbackOpen(false)}
                footer={[
                    <Button key="back" onClick={() => setIsFeedbackOpen(false)}>
                        Back
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={feedbackLoading}
                        disabled={!feedbackComment.trim()}
                        onClick={submitReview}
                    >
                        Submit
                    </Button>,
                ]}
            >
                <div style={{ marginBottom: 16 }}>
                    <Text strong>1. How satisfied are you with this mentorship session?</Text>
                    <div style={{ marginTop: 12 }}>
                        <Radio.Group
                            value={feedbackRating ?? undefined}
                            onChange={(e) => setFeedbackRating(e.target.value)}
                        >
                            <Space size="large">
                                {EMOJIS.map((e) => (
                                    <Radio key={e.value} value={e.value} aria-label={`rating-${e.value}`}>
                                        <span style={{ fontSize: 24, lineHeight: 1 }}>{e.label}</span>
                                    </Radio>
                                ))}
                            </Space>
                        </Radio.Group>
                    </div>
                </div>

                <div style={{ marginBottom: 8 }}>
                    <Text strong>2. Please add a review for your session.</Text>
                </div>
                <Input.TextArea
                    placeholder="Share any feedback about your mentor or the session experience..."
                    autoSize={{ minRows: 4 }}
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                />
            </Modal>

            {/* —— Thank you 弹窗 —— */}
            <Modal
                open={isThanksOpen}
                footer={[
                    <Button key="back" onClick={() => setIsThanksOpen(false)}>
                        Back to Mentor
                    </Button>,
                    <Button
                        key="check"
                        type="primary"
                        onClick={() => {
                            setIsThanksOpen(false);
                            // 可选：跳转到“我的评论”页或刷新
                            // router.push('/my/reviews')
                        }}
                    >
                        Check my review
                    </Button>,
                ]}
                onCancel={() => setIsThanksOpen(false)}
            >
                <div style={{ textAlign: 'center', padding: '12px 8px' }}>
                    <Title level={4} style={{ marginBottom: 0 }}>
                        Thank you for your feedback!
                    </Title>
                </div>
            </Modal>
        </div>
    );
}