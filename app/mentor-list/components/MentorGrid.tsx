'use client';
import { Card, Tag, Button, Empty } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserOutlined, IdcardOutlined, AppstoreOutlined, ClockCircleOutlined } from '@ant-design/icons';
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

/** 统一解析 mentor.mentor.services：兼容 number 或 {price,type}；允许 null/undefined */
function extractServiceEntries(services?: Record<string, any> | null) {
    const list = Object.entries(services ?? {}).map(([key, v]) => {
        if (typeof v === 'number') {
            return { type: key, price: Number(v) };
        }
        const t = typeof v?.type === 'string' ? v.type : key;
        const p = Number(v?.price);
        return { type: t, price: Number.isFinite(p) ? p : NaN };
    });
    return list.filter(e => Number.isFinite(e.price));
}

/** 有些后端会把 mentors 作为数组返回，这里统一取单对象 */
const asMentorObj = (u: any) => (Array.isArray(u?.mentor) ? u.mentor[0] : u?.mentor) ?? null;

/** 获取导师价格（首个非 Free Coffee Chat） */
const getMentorPrice = (u: Mentor): number => {
    const m = asMentorObj(u);
    const entries = extractServiceEntries(m?.services);
    const firstPaid = entries.find(e => !isFreeCoffeeChat((e.type ?? '') as string));
    return firstPaid ? firstPaid.price : 0;
};

export default function MentorGrid({ filters, mentors, loading }: MentorGridProps) {
    const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);
    const router = useRouter();

    useEffect(() => {
        let filtered = mentors.filter(u => {
            const m = asMentorObj(u);

            if (filters.jobTitle && !m?.title?.toLowerCase().includes(filters.jobTitle.toLowerCase())) {
                return false;
            }

            if (filters.industries?.length) {
                const inds = Array.isArray(u.industries) ? u.industries : [];
                if (!inds.some(i => filters.industries!.includes(i))) return false;
            }

            if (filters.company?.length && !filters.company.includes(m?.company ?? '')) {
                return false;
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

        const rankOf = (u: Mentor) => (asMentorObj(u)?.default_ranking ?? Number.POSITIVE_INFINITY); // NULLS LAST

        const tie = (a: Mentor, b: Mentor) => {
            // 次级排序：价格升序 -> 经验降序 -> 用户名
            const pa = getMentorPrice(a), pb = getMentorPrice(b);
            if (pa !== pb) return pa - pb;

            const ya = asMentorObj(a)?.years_of_experience ?? 0;
            const yb = asMentorObj(b)?.years_of_experience ?? 0;
            if (ya !== yb) return yb - ya;

            return (a.username || '').localeCompare(b.username || '');
        };

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
                    default:
                        return rankOf(a) - rankOf(b) || tie(a, b);
                }
            });
        } else {
            // 无显式排序：按 default_ranking 升序（NULLS LAST），再用 tiebreaker 保稳定
            filtered = [...filtered].sort((a, b) => rankOf(a) - rankOf(b) || tie(a, b));
        }

        setFilteredMentors(filtered);
    }, [mentors, filters]);

    const goProfile = (id: string | number) => {
        router.push(`/mentor/${id}`);
    };

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
                        onClick={() => goProfile(user.user_id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') goProfile(user.user_id);
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className={styles.mentorInfo}>
                            <h3 className={styles.name}>{user.username}</h3>

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

                        {/* 标签：全部显示，自动换行 */}
                        <div className={styles.mentorTagsRow}>
                            {industries.map(industry => (
                                <Tag className={styles.mentorTag} key={industry}>{industry}</Tag>
                            ))}
                        </div>

                        <div className={styles.cardFooter}>
                            <div className={styles.mentorPrice}>
                                {hourly != null ? `$${hourly}/hr` : 'Free'}
                            </div>
                            {/* 阻止冒泡，避免触发 Card 的 onClick */}
                            <Link href={`/mentor/${user.user_id}`} onClick={(e) => e.stopPropagation()}>
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
