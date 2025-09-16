'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    Card, Typography, Row, Col, Avatar, Space,
    Button, Modal, Input, Radio, message, Tooltip,
} from 'antd';
import { MessageOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useUser } from '@clerk/nextjs';
import { Spin } from 'antd';

const { Text, Title } = Typography;

type Review = {
    id: string;
    reviewee?: string;
    reviewer: string;         // 历史数据可能是 userId 或 username
    content: string;
    rating: number | null;
    creation_time: string;    // ISO
};

type DisplayReview = Review & {
    reviewer_username?: string;
    reviewer_avatar?: string | null;
};

// 尽量兼容老数据：判断 reviewer 字符串是否像 userId
const looksLikeUserId = (s: string) => s.length > 20 || s.startsWith('user_') || s.includes('-');

export default function MentorReviews({ mentorId }: { mentorId?: string }) {
    const { user, isSignedIn } = useUser();

    // 当前用户展示名 & 头像（仅用于乐观更新 UI）
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
    const [loadingList, setLoadingList] = useState(true);
    const [hasFetched, setHasFetched] = useState(false);

    // 新增：我与该 mentor 的 completed 场次数 & 已写条数
    const [completedCount, setCompletedCount] = useState<number>(0);
    const [myReviewsCount, setMyReviewsCount] = useState<number>(0);

    // 允许写的剩余条数 = completedCount - myReviewsCount（最少 0）
    const remainingQuota = Math.max(0, completedCount - myReviewsCount);

    /** 统计“我与该 mentor 的 completed 预约数”（我是 mentee） */
    useEffect(() => {
        if (!mentorId || !isSignedIn || !user?.id) {
            setCompletedCount(0);
            return;
        }

        (async () => {
            try {
                const res = await fetch('/api/appointment/get', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: user.id }),
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json?.message || 'Failed to load appointments');

                const all = json?.data?.appointments ?? [];
                console.log('[DEBUG] my appts with this mentor:',
                    all
                        .filter((a: any) => String(a.mentor_id) === String(mentorId) && String(a.mentee_id) === String(user.id))
                        .map((a: any) => ({ id: a.id, status: a.status, start: a.start_time, end: a.end_time }))
                );
                const count = all.filter((a: any) =>
                    a.status === 'completed' &&
                    String(a.mentor_id) === String(mentorId) &&
                    String(a.mentee_id) === String(user.id)
                ).length;

                setCompletedCount(count);
            } catch (e: any) {
                message.error(e?.message || 'Failed to load completed count');
                setCompletedCount(0);
            }
        })();
    }, [mentorId, isSignedIn, user?.id]);

    /** 拉取该 mentor 的全部评论 */
    useEffect(() => {
        if (!mentorId) return;
        setLoadingList(true);
        setHasFetched(false);
        (async () => {
            try {
                // setLoadingList(true);
                const res = await fetch(`/api/reviews/list_by_reviewee?revieweeId=${mentorId}`);
                const json = await res.json();
                if (!res.ok) throw new Error(json?.message || 'Failed to load reviews');
                const list: Review[] = Array.isArray(json?.data) ? json.data : [];
                setReviews(list);
                setDisplayList(
                    list.map(r => ({
                        ...r,
                        reviewer_username: r.reviewer,
                        reviewer_avatar: null,
                    }))
                );
            } catch (e: any) {
                message.error(e?.message || 'Failed to load reviews');
            } finally {
                setLoadingList(false);
                setHasFetched(true);
            }
        })();
    }, [mentorId]);

    /** reviewer（可能是 userId）映射成 {username, avatar} 用于展示 */
    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (reviews.length === 0) return;

            const idsToFetch = Array.from(
                new Set(
                    reviews.filter(r => looksLikeUserId(r.reviewer)).map(r => r.reviewer)
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
                setDisplayList(prev =>
                    prev.map(r => {
                        if (looksLikeUserId(r.reviewer)) {
                            const hit = mapById.get(r.reviewer);
                            return {
                                ...r,
                                reviewer_username: hit?.username ?? r.reviewer,
                                reviewer_avatar: hit?.profile_url ?? null,
                            };
                        }
                        return r;
                    })
                );
            }
        })();

        return () => { cancelled = true; };
    }, [reviews]);

    /** 统计“我已写过的评论数”（兼容历史：可能 reviewer 存的是 username） */
    useEffect(() => {
        if (!mentorId || !user?.id) {
            setMyReviewsCount(0);
            return;
        }
        const possibleMe = new Set(
            [user.id, user.username, user.fullName, currentUsername].filter(Boolean) as string[]
        );
        const count = reviews.filter(r =>
            String(r.reviewee) === String(mentorId) &&
            possibleMe.has(r.reviewer)
        ).length;
        setMyReviewsCount(count);
    }, [reviews, mentorId, user?.id, user?.username, user?.fullName, currentUsername]);

    /** 头部均分与数量 */
    const { ratingAvg, total } = useMemo(() => {
        const valid = displayList.map(r => r.rating).filter((x): x is number => typeof x === 'number');
        const sum = valid.reduce((a, b) => a + b, 0);
        const avg = valid.length ? sum / valid.length : 0;
        return { ratingAvg: Number(avg.toFixed(1)), total: displayList.length };
    }, [displayList]);

    /** 打开写评弹层：没有 quota 或未登录时拦截 */
    const openWrite = () => {
        if (!mentorId) return message.warning('No mentor selected.');
        if (!isSignedIn) return message.info('Please sign in to write a review.');

        if (completedCount <= 0) {
            return message.warning('Only mentees with completed sessions can write reviews.');
        }
        if (remainingQuota <= 0) {
            return message.warning('You have used all your review quota for completed sessions.');
        }

        setFeedbackComment('');
        setFeedbackRating(null);
        setIsFeedbackOpen(true);
    };

    /** 提交评论：不传 reviewer，由后端从 auth 注入 userId；前端再兜底校验 quota */
    const submitReview = async () => {
        if (!mentorId) return;
        if (!feedbackComment.trim()) return message.warning('Please write a short comment.');
        if (feedbackRating == null) return message.warning('Please select a rating.');

        // 前端再兜底
        if (completedCount <= 0) {
            return message.warning('Only mentees with completed sessions can write reviews.');
        }
        if (remainingQuota <= 0) {
            return message.warning('No remaining review quota. You can only review completed sessions.');
        }

        try {
            setFeedbackLoading(true);
            const res = await fetch('/api/reviews/insert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reviewee: mentorId,
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

            // 乐观更新：插入展示列表顶部（展示名仍用当前用户信息）
            const nowISO = new Date().toISOString();
            setDisplayList(prev => [
                {
                    id: data?.data?.id ?? `tmp_${Date.now()}`,
                    reviewer: currentUsername,               // 仅作展示，不代表后端存储
                    reviewer_username: currentUsername,
                    reviewer_avatar: currentAvatar,
                    content: feedbackComment.trim(),
                    rating: feedbackRating,
                    creation_time: data?.data?.creation_time ?? nowISO,
                },
                ...prev,
            ]);

            // 我已写条数 +1（与后端校验保持一致）
            setMyReviewsCount(v => v + 1);
        } catch (e: any) {
            message.error(e?.message || 'Failed to submit review');
        } finally {
            setFeedbackLoading(false);
        }
    };

    const isEmpty = hasFetched && !loadingList && reviews.length === 0;

    return (
        <div style={{ width: '100%' }}>
            {/* 顶部统计 + 写评按钮 */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    justifyContent: 'space-between',
                    marginBottom: 16,
                    flexWrap: 'wrap',
                }}
            >
                {/* 评分区：仅在加载完成且有数据时渲染，避免 0/5 闪烁 */}
                {!loadingList && reviews.length > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <Text style={{ fontSize: 28, fontWeight: 700 }}>{ratingAvg}</Text>
                        <Text style={{ fontSize: 28 }}>/5</Text>
                        {total >= 5 && (
                            <Text type="secondary" style={{ marginLeft: 8 }}>
                                ({total} reviews)
                            </Text>
                        )}
                    </div>
                ) : (
                    <div />
                )}

                <Space>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        {isSignedIn
                            ? `Completed with this mentor: ${completedCount}. Your reviews: ${myReviewsCount}.`
                            : 'Sign in to check your review quota.'}
                    </Text>
                    <Tooltip
                        title={
                            !isSignedIn
                                ? 'Please sign in to write a review.'
                                : completedCount <= 0
                                    ? 'Only mentees with completed sessions can write reviews.'
                                    : remainingQuota <= 0
                                        ? 'You have used all your review quota for completed sessions.'
                                        : `You can write ${remainingQuota} more review(s).`
                        }
                    >
                        <Button
                            type="link"
                            icon={<MessageOutlined />}
                            onClick={openWrite}
                            style={{ fontSize: 16, paddingRight: 0 }}
                            disabled={!isSignedIn || completedCount <= 0 || remainingQuota <= 0}
                        >
                            {remainingQuota > 0 ? `Write a review (${remainingQuota} left)` : 'Write a review'}
                        </Button>
                    </Tooltip>
                </Space>
            </div>

            {/* 列表：加载时只显示转圈；加载后直接显示空态或内容 */}
            <div style={{ minHeight: 260 }}>
                <Spin spinning={loadingList} tip="Loading reviews...">
                    {isEmpty ? (
                        <Card
                            style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                            bodyStyle={{ padding: 24, display: 'flex', justifyContent: 'center' }}
                        >
                            <Space>
                                <InfoCircleOutlined />
                                <Text type="secondary">No reviews yet</Text>
                            </Space>
                        </Card>
                    ) : (
                        <Row gutter={[24, 24]}>
                            {displayList.map((r) => (
                                <Col key={r.id} xs={24} md={12}>
                                    <Card
                                        bodyStyle={{ padding: 16 }}
                                        style={{
                                            borderRadius: 8,
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                            height: 220,
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

                                        {/* 内容（四行截断） */}
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
                    )}
                </Spin>
            </div>

            {/* 写评弹窗 */}
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

            {/* Thank you 弹窗 */}
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