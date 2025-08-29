'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    Card, Typography, Row, Col, Avatar, Space,
    Button, Modal, Input, Radio, message,
} from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useUser } from '@clerk/nextjs';

const { Text, Title } = Typography;

type Review = {
    id: string;
    reviewee?: string;
    reviewer: string;         // 可能是 user_id 或 username
    content: string;
    rating: number | null;
    creation_time: string;    // ISO
};

// 供渲染用的扩展类型：补上映射后的用户名与头像
type DisplayReview = Review & {
    reviewer_username?: string;
    reviewer_avatar?: string | null;
};

// 判断 reviewer 是否像 user_id（按需调整规则）
const looksLikeUserId = (s: string) => s.length > 20 || s.startsWith('user_') || s.includes('-');

export default function MentorReviews({ mentorId }: { mentorId?: string }) {
    const { user, isSignedIn } = useUser();

    // 当前提交者信息（用于乐观更新）
    const currentUsername =
        user?.username || user?.fullName || (user?.id ? `user_${user.id.slice(0, 6)}` : 'anonymous');
    const currentAvatar = user?.imageUrl ?? null;

    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [isThanksOpen, setIsThanksOpen] = useState(false);
    const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [feedbackLoading, setFeedbackLoading] = useState(false);

    const [reviews, setReviews] = useState<Review[]>([]);
    const [displayList, setDisplayList] = useState<DisplayReview[]>([]);
    const [loadingList, setLoadingList] = useState(false);

    // 拉取评论列表
    useEffect(() => {
        if (!mentorId) return;
        (async () => {
            try {
                setLoadingList(true);
                const res = await fetch(`/api/reviews/list_by_reviewee?revieweeId=${mentorId}`);
                const json = await res.json();
                if (!res.ok) throw new Error(json?.message || 'Failed to load reviews');
                const list: Review[] = Array.isArray(json?.data) ? json.data : [];
                setReviews(list);
            } catch (e: any) {
                message.error(e?.message || 'Failed to load reviews');
            } finally {
                setLoadingList(false);
            }
        })();
    }, [mentorId]);

    // 把 reviewer（可能是 user_id）映射为 {username, profile_url}
    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (reviews.length === 0) {
                setDisplayList([]);
                return;
            }

            const idsToFetch = Array.from(
                new Set(
                    reviews
                        .filter(r => looksLikeUserId(r.reviewer))
                        .map(r => r.reviewer)
                )
            );

            if (idsToFetch.length === 0) {
                if (!cancelled) {
                    setDisplayList(
                        reviews.map(r => ({
                            ...r,
                            reviewer_username: r.reviewer,
                            reviewer_avatar: null,
                        }))
                    );
                }
                return;
            }

            const results = await Promise.allSettled(
                idsToFetch.map(async (uid) => {
                    const res = await fetch(`/api/user/${uid}`);
                    const json = await res.json().catch(() => ({}));
                    if (!res.ok) throw new Error(json?.message || 'fetch user failed');
                    const u = json?.data ?? json;
                    return { uid, username: u?.username ?? uid, profile_url: u?.profile_url ?? null };
                })
            );

            const mapById = new Map<string, { username: string; profile_url: string | null }>();
            results.forEach((p, i) => {
                const uid = idsToFetch[i];
                if (p.status === 'fulfilled') {
                    mapById.set(uid, { username: p.value.username, profile_url: p.value.profile_url });
                } else {
                    mapById.set(uid, { username: uid, profile_url: null });
                }
            });

            if (!cancelled) {
                setDisplayList(
                    reviews.map(r => {
                        if (looksLikeUserId(r.reviewer)) {
                            const hit = mapById.get(r.reviewer);
                            return {
                                ...r,
                                reviewer_username: hit?.username ?? r.reviewer,
                                reviewer_avatar: hit?.profile_url ?? null,
                            };
                        }
                        return { ...r, reviewer_username: r.reviewer, reviewer_avatar: null };
                    })
                );
            }
        })();

        return () => { cancelled = true; };
    }, [reviews]);

    // 顶部均分与数量
    const { ratingAvg, total } = useMemo(() => {
        const valid = displayList.map(r => r.rating).filter((x): x is number => typeof x === 'number');
        const sum = valid.reduce((a, b) => a + b, 0);
        const avg = valid.length ? sum / valid.length : 0;
        return { ratingAvg: Number(avg.toFixed(1)), total: displayList.length };
    }, [displayList]);

    const openWrite = () => {
        if (!mentorId) return message.warning('No mentor selected.');
        if (!isSignedIn) return message.info('Please sign in to write a review.');
        setFeedbackComment('');
        setFeedbackRating(null);
        setIsFeedbackOpen(true);
    };

    const submitReview = async () => {
        if (!mentorId) return;
        if (!feedbackComment.trim()) return message.warning('Please write a short comment.');
        if (feedbackRating == null) return message.warning('Please select a rating.');

        try {
            setFeedbackLoading(true);
            const res = await fetch('/api/reviews/insert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reviewee: mentorId,
                    reviewer: currentUsername,         // 传 username
                    content: feedbackComment.trim(),
                    rating: feedbackRating,
                }),
            });
            const data = await res.json().catch(() => ({} as any));
            if (!res.ok) throw new Error(data?.message || 'Submit failed');

            setIsFeedbackOpen(false);
            setIsThanksOpen(true);
            setFeedbackComment('');
            setFeedbackRating(null);

            // 乐观更新：把新评论插入到显示列表顶部
            const nowISO = new Date().toISOString();
            setDisplayList(prev => [
                {
                    id: data?.data?.id ?? `tmp_${Date.now()}`,
                    reviewer: currentUsername,               // 原始字段
                    reviewer_username: currentUsername,      // 显示名
                    reviewer_avatar: currentAvatar,          // 头像（用 Clerk 当前头像）
                    content: feedbackComment.trim(),
                    rating: feedbackRating,
                    creation_time: data?.data?.creation_time ?? nowISO,
                },
                ...prev,
            ]);

            // 如果你希望也同步更新原始 reviews，可按需 setReviews
            // setReviews(prev => [...prev]); // 可选
        } catch (e: any) {
            message.error(e?.message || 'Failed to submit review');
        } finally {
            setFeedbackLoading(false);
        }
    };

    const isEmpty = !loadingList && total === 0;

    return (
        <div style={{ width: '100%' }}>
            {/* 顶部：当有数据时显示统计；无数据时只保留 Write a review 按钮 */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    justifyContent: 'space-between',
                    marginBottom: 16,
                }}
            >
                {!isEmpty ? (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <Text style={{ fontSize: 28, fontWeight: 700 }}>{ratingAvg}</Text>
                        <Text style={{ fontSize: 28 }}>/5</Text>
                        {total >= 5 && (
                            <Text type="secondary" style={{ marginLeft: 8 }}>
                                ({total} reviews{loadingList ? ', loading…' : ''})
                            </Text>
                        )}
                    </div>
                ) : <div />}

                <Button
                    type="link"
                    icon={<MessageOutlined />}
                    onClick={openWrite}
                    style={{ fontSize: 16, paddingRight: 0 }}
                >
                    Write a review
                </Button>
            </div>

            {/* 当没有 review：不展示标签和卡片，只提示“没有 review” */}
            {isEmpty ? (
                <Card
                    style={{
                        borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                    bodyStyle={{ padding: 24, display: 'flex', justifyContent: 'center' }}
                >
                    <Text type="secondary">No reviews yet</Text>
                    {/* 如果你想要中文：<Text type="secondary">还没有任何评论</Text> */}
                </Card>
            ) : (
                <>
                    {/* 两列卡片 */}
                    <Row gutter={[24, 24]}>
                        {displayList.map((r) => (
                            <Col key={r.id} xs={24} md={12}>
                                <Card
                                    bodyStyle={{ padding: 16 }}
                                    style={{
                                        borderRadius: 8,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                        height: 220, // 固定高度
                                        display: 'flex',
                                        flexDirection: 'column',
                                    }}
                                >
                                    {/* 头部：头像 用户名 评分 日期 */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: 12,
                                        }}
                                    >
                                        <Space>
                                            <Avatar size={28} src={r.reviewer_avatar ?? undefined} style={{ background: '#eee' }}>
                                                {!r.reviewer_avatar && (r.reviewer_username?.[0] ?? '?')}
                                            </Avatar>
                                            <Text strong>{r.reviewer_username ?? r.reviewer}</Text>
                                            {typeof r.rating === 'number' && (
                                                <>
                                                    <Text strong style={{ marginLeft: 4 }}>{r.rating.toFixed(1)}</Text>
                                                    <Text type="secondary">/5</Text>
                                                </>
                                            )}
                                        </Space>

                                        <Text type="secondary">
                                            {dayjs(r.creation_time).format('MMM D, YYYY')}
                                        </Text>
                                    </div>

                                    {/* 内容（若需要 4 行截断，可加 line-clamp 样式） */}
                                    <Text
                                        style={{
                                            color: 'rgba(0,0,0,0.65)',
                                            whiteSpace: 'pre-wrap',
                                            overflow: 'hidden',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 4,
                                            WebkitBoxOrient: 'vertical',
                                            lineHeight: '1.5em',
                                            flex: 1,
                                        }}
                                    >
                                        {r.content}
                                    </Text>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </>
            )}

            {/* —— Write a review 弹窗 —— */}
            <Modal
                title="Share Your Feedback"
                open={isFeedbackOpen}
                onCancel={() => setIsFeedbackOpen(false)}
                footer={[
                    <Button key="back" onClick={() => setIsFeedbackOpen(false)}>Back</Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={feedbackLoading}
                        disabled={!feedbackComment.trim() || feedbackRating == null}
                        onClick={submitReview}
                    >
                        Submit
                    </Button>,
                ]}
            >
                <div style={{ marginBottom: 16 }}>
                    <Text strong>1. How satisfied are you with this mentorship session?</Text>
                    <div style={{ marginTop: 12 }}>
                        <Radio.Group value={feedbackRating ?? undefined} onChange={(e) => setFeedbackRating(e.target.value)}>
                            <Space size="large">
                                {[1,2,3,4,5].map((v) => (
                                    <Radio key={v} value={v} aria-label={`rating-${v}`}>
                                        <span style={{ fontSize: 24, lineHeight: 1 }}>{['😡','😟','😐','😊','😄'][v-1]}</span>
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
                    <Button key="back" onClick={() => setIsThanksOpen(false)}>Back to Mentor</Button>,
                    <Button key="check" type="primary" onClick={() => setIsThanksOpen(false)}>
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