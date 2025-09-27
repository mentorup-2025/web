'use client';
import { Card, Tag, Button, Empty } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    UserOutlined,
    IdcardOutlined,
    AppstoreOutlined,
    ClockCircleOutlined,
    StarFilled,
} from '@ant-design/icons';
import styles from '../search.module.css';
import { useEffect, useState } from 'react';
import { Mentor, SearchFiltersType } from '../../../types';
import { isFreeCoffeeChat } from '../../services/constants';
import { netToGross } from '../../services/priceHelper';

interface MentorGridProps {
    filters: SearchFiltersType;
    mentors: Mentor[];
    loading: boolean;
}

function extractServiceEntries(services?: Record<string, any> | null) {
    const list = Object.entries(services ?? {}).map(([key, v]) => {
        if (typeof v === 'number') {
            return { type: key, price: Number(v) };
        }
        const t = typeof (v as any)?.type === 'string' ? (v as any).type : key;
        const p = Number((v as any)?.price);
        return { type: t, price: Number.isFinite(p) ? p : NaN };
    });
    return list.filter(e => Number.isFinite(e.price));
}

const asMentorObj = (u: any) => (Array.isArray(u?.mentor) ? u.mentor[0] : u?.mentor) ?? null;

const getMentorPrice = (u: Mentor): number => {
    const m = asMentorObj(u);
    const entries = extractServiceEntries(m?.services);
    const firstPaid = entries.find(e => !isFreeCoffeeChat((e.type ?? '') as string));
    return firstPaid ? firstPaid.price : 0;
};

const getReviewCount = (obj: any): number | null => {
    const cand = [
        obj?.review_count,
        obj?.reviews_count,
        obj?.rating_count,
        obj?.total_reviews,
        obj?.ratings_count,
    ];
    const n = cand.find(v => Number.isFinite(Number(v)));
    return n != null ? Number(n) : null;
};

// 提取平均评分（m.avg_rating 或顶层 avg_rating）
const getAvgRating = (u: Mentor): number | null => {
    const m = asMentorObj(u);
    const raw = m?.avg_rating ?? (u as any)?.avg_rating;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
};

export default function MentorGrid({ filters, mentors, loading }: MentorGridProps) {
    const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);
    const router = useRouter();

    // 统一的跳转函数（避免在事件里再次调用 useRouter）
    const goProfile = (id: string | number) => {
        router.push(`/mentor/${id}`);
    };

    useEffect(() => {
        let filtered = mentors.filter(u => {
            const m = asMentorObj(u);

            if (filters.jobTitle?.length) {
                const title = m?.title?.toLowerCase() ?? '';
                const match = filters.jobTitle.some(jt => title.includes(jt.toLowerCase()));
                if (!match) return false;
            }

            if (filters.industries?.length) {
                const inds = Array.isArray(u.industries) ? u.industries : [];
                if (!inds.some(i => filters.industries!.includes(i))) return false;
            }

            if (filters.company?.length) {
                const companies = Array.isArray(filters.company) ? filters.company : [filters.company];
                if (!companies.includes(m?.company ?? '')) return false;
            }

            const yoe = Number(m?.years_of_experience ?? 0);
            if (filters.minExperience != null && yoe < Number(filters.minExperience)) return false;
            if (filters.maxExperience != null && yoe > Number(filters.maxExperience)) return false;

            if (filters.minPrice != null || filters.maxPrice != null) {
                const minP = filters.minPrice != null ? Number(filters.minPrice) : -Infinity;
                const maxP = filters.maxPrice != null ? Number(filters.maxPrice) : Infinity;
                const entries = extractServiceEntries(m?.services);
                if (!entries.some(e => e.price >= minP && e.price <= maxP)) return false;
            }

            if (filters.serviceTypes?.length) {
                const entries = extractServiceEntries(m?.services);
                const types = entries.map(e => e.type);
                if (!types.some(t => filters.serviceTypes!.includes(t))) return false;
            }

            return true;
        });

        const rankOf = (u: Mentor) =>
            asMentorObj(u)?.default_ranking ?? Number.POSITIVE_INFINITY;

        const tie = (a: Mentor, b: Mentor) => {
            const pa = getMentorPrice(a), pb = getMentorPrice(b);
            if (pa !== pb) return pa - pb;

            const ya = asMentorObj(a)?.years_of_experience ?? 0;
            const yb = asMentorObj(b)?.years_of_experience ?? 0;
            if (ya !== yb) return yb - ya;

            return (a.username || '').localeCompare(b.username || '');
        };

        // 增加对 rating-asc / rating-desc 的处理
        if (filters.sort) {
            filtered = [...filtered].sort((a, b) => {
                switch (filters.sort) {
                    case 'price-asc':
                        return getMentorPrice(a) - getMentorPrice(b) || rankOf(a) - rankOf(b);
                    case 'price-desc':
                        return getMentorPrice(b) - getMentorPrice(a) || rankOf(a) - rankOf(b);
                    case 'yoe-asc':
                        return (asMentorObj(a)?.years_of_experience ?? 0) - (asMentorObj(b)?.years_of_experience ?? 0) || rankOf(a) - rankOf(b);
                    case 'yoe-desc':
                        return (asMentorObj(b)?.years_of_experience ?? 0) - (asMentorObj(a)?.years_of_experience ?? 0) || rankOf(a) - rankOf(b);
                    case 'rating-desc': {
                        const ra = getAvgRating(a); // 高 -> 低；无评分排在后面
                        const rb = getAvgRating(b);
                        const va = ra ?? -Infinity;
                        const vb = rb ?? -Infinity;
                        if (va !== vb) return vb - va;
                        return rankOf(a) - rankOf(b) || tie(a, b);
                    }
                    case 'rating-asc': {
                        const ra = getAvgRating(a); // 低 -> 高；无评分排在后面
                        const rb = getAvgRating(b);
                        const va = ra ?? Infinity;
                        const vb = rb ?? Infinity;
                        if (va !== vb) return va - vb;
                        return rankOf(a) - rankOf(b) || tie(a, b);
                    }
                    default:
                        return rankOf(a) - rankOf(b) || tie(a, b);
                }
            });
        } else {
            filtered = [...filtered].sort((a, b) => rankOf(a) - rankOf(b) || tie(a, b));
        }

        setFilteredMentors(filtered);
    }, [mentors, filters]);

    if (loading) return <div>Loading...</div>;

    if (filteredMentors.length === 0) {
        return (
            <div className={styles.noResults}>
                <Empty description={<span>No mentors found matching your criteria.<br />Please try adjusting your filters.</span>} />
            </div>
        );
    }

    return (
        <div className={styles.mentorGrid}>
            {filteredMentors.map(user => {
                const m = asMentorObj(user);
                const industries = Array.isArray(user.industries) ? user.industries : [];

                const entries = extractServiceEntries(m?.services);
                const firstPaid = entries.find(e => !isFreeCoffeeChat((e.type ?? '') as string));
                const hourly = firstPaid ? netToGross(firstPaid.price) : null;

                const avgRatingRaw = m?.avg_rating ?? (user as any)?.avg_rating;
                const avgRating = Number.isFinite(Number(avgRatingRaw)) ? Number(avgRatingRaw) : null;
                const reviewCount = getReviewCount(m) ?? getReviewCount(user as any);

                return (
                    <Card
                        key={user.user_id}
                        className={styles.mentorCard}
                        cover={
                            user.profile_url ? (
                                <div className={styles.coverBox}>
                                    <img
                                        src={user.profile_url}
                                        alt={user.username}
                                        className={styles.coverImg}
                                        onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.png'; }}
                                    />
                                </div>
                            ) : (
                                <div className={styles.coverFallback}>
                                    <UserOutlined />
                                </div>
                            )
                        }
                        hoverable
                        onClick={() => goProfile(user.user_id)}        // ✅ 使用外层 router
                        role="link"                                     // ✅ 更合适的语义
                        tabIndex={0}
                        onKeyDown={(e) => {                             // ✅ 可访问性：Enter/空格
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                goProfile(user.user_id);
                            }
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className={styles.mentorInfo}>
                            <h3
                                className={styles.name}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}
                            >
                                {user.username}

                                {avgRating != null && (
                                    <span
                                        className={styles.inlineRating}
                                        aria-label={`Average rating ${avgRating}${reviewCount != null ? ` from ${reviewCount} reviews` : ''}`}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600, color: '#1677ff' }}
                                    >
                    <StarFilled style={{ color: '#1677ff' }} />
                    <span>{avgRating.toFixed(1)}</span>
                                        {reviewCount != null && <span style={{ fontWeight: 400 }}>({reviewCount})</span>}
                  </span>
                                )}
                            </h3>

                            <ul className={styles.metaList}>
                                <li className={styles.metaItem}>
                                    <IdcardOutlined className={styles.metaIcon} />
                                    <span>{m?.title || '—'}</span>
                                </li>
                                <li className={styles.metaItem}>
                                    <AppstoreOutlined className={styles.metaIcon} />
                                    <span>{m?.company || '—'}</span>
                                </li>
                                <li className={styles.metaItem}>
                                    <ClockCircleOutlined className={styles.metaIcon} />
                                    <span>{(m?.years_of_experience ?? 0)} YOE</span>
                                </li>
                            </ul>
                        </div>

                        <div className={styles.mentorTagsRow}>
                            {industries.map(industry => (
                                <Tag className={styles.mentorTag} key={industry}>{industry}</Tag>
                            ))}
                        </div>

                        <div className={styles.cardFooter}>
                            <div className={styles.mentorPrice}>
                                {hourly != null ? `$${hourly}/hr` : 'Free'}
                            </div>
                            <Link
                                href={`/mentor/${user.user_id}`}
                                onClick={(e) => e.stopPropagation()}        // 避免按钮点击触发整卡片跳转
                            >
                                <Button
                                    type="primary"
                                    size="middle"
                                    className={styles.scheduleButton}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Schedule
                                </Button>
                            </Link>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
