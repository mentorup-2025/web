'use client';
import { Card, Tag, Button, Empty } from 'antd';
import Link from 'next/link';
import { UserOutlined, SolutionOutlined, BankOutlined, ClockCircleOutlined } from '@ant-design/icons';
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

// 统一解析 mentor.mentor.services：兼容 number 或 {price,type}
function extractServiceEntries(services: Record<string, any> | undefined) {
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

// 获取导师价格（首个非 Free Coffee Chat）
const getMentorPrice = (mentor: Mentor): number => {
    const entries = extractServiceEntries(mentor.mentor.services);
    const firstPaid = entries.find(e => !isFreeCoffeeChat((e.type ?? '') as string));
    return firstPaid ? firstPaid.price : 0;
};

export default function MentorGrid({ filters, mentors, loading }: MentorGridProps) {
    const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);

    useEffect(() => {
        let filtered = mentors.filter(mentor => {
            if (filters.jobTitle && !mentor.mentor.title?.toLowerCase().includes(filters.jobTitle.toLowerCase())) {
                return false;
            }
            if (filters.industries?.length) {
                const ok = mentor.industries?.some(i => filters.industries!.includes(i));
                if (!ok) return false;
            }
            if (filters.company?.length) {
                if (!filters.company.includes(mentor.mentor.company)) return false;
            }
            const yoe = Number(mentor.mentor.years_of_experience ?? 0);
            if (filters.minExperience != null && yoe < Number(filters.minExperience)) return false;
            if (filters.maxExperience != null && yoe > Number(filters.maxExperience)) return false;
            if (filters.minPrice != null || filters.maxPrice != null) {
                const minP = filters.minPrice != null ? Number(filters.minPrice) : -Infinity;
                const maxP = filters.maxPrice != null ? Number(filters.maxPrice) : Infinity;
                const entries = extractServiceEntries(mentor.mentor.services);
                const hit = entries.some(e => e.price >= minP && e.price <= maxP);
                if (!hit) return false;
            }
            if (filters.serviceTypes?.length) {
                const entries = extractServiceEntries(mentor.mentor.services);
                const types = entries.map(e => e.type);
                if (!types.some(t => filters.serviceTypes!.includes(t))) return false;
            }
            return true;
        });

        if (filters.sort) {
            filtered = [...filtered].sort((a, b) => {
                switch (filters.sort) {
                    case 'price-asc':
                        return getMentorPrice(a) - getMentorPrice(b);
                    case 'price-desc':
                        return getMentorPrice(b) - getMentorPrice(a);
                    case 'yoe-asc':
                        return (a.mentor.years_of_experience || 0) - (b.mentor.years_of_experience || 0);
                    case 'yoe-desc':
                        return (b.mentor.years_of_experience || 0) - (a.mentor.years_of_experience || 0);
                    default:
                        return 0;
                }
            });
        }

        setFilteredMentors(filtered);
    }, [mentors, filters]);

    if (loading) return <div>Loading...</div>;

    if (filteredMentors.length === 0) {
        return (
            <div className={styles.noResults}>
                <Empty description={<span>No mentors found matching your criteria.<br/>Please try adjusting your filters.</span>} />
            </div>
        );
    }

    return (
        <div className={styles.mentorGrid}>
            {filteredMentors.map(user => {
                const entries = extractServiceEntries(user.mentor.services);
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
                    >
                        <div className={styles.mentorInfo}>
                            <h3 className={styles.name}>{user.username}</h3>

                            <ul className={styles.metaList}>
                                <li className={styles.metaItem}>
                                    <SolutionOutlined className={styles.metaIcon} />
                                    <span>{user.mentor.title || '—'}</span>
                                </li>
                                <li className={styles.metaItem}>
                                    <BankOutlined className={styles.metaIcon} />
                                    <span>{user.mentor.company || '—'}</span>
                                </li>
                                <li className={styles.metaItem}>
                                    <ClockCircleOutlined className={styles.metaIcon} />
                                    <span>{(user.mentor.years_of_experience ?? 0)} YOE</span>
                                </li>
                            </ul>
                        </div>

                        {/* 标签：全部显示，自动换行 */}
                        <div className={styles.mentorTagsRow}>
                            {user.industries.map(industry => (
                                <Tag className={styles.mentorTag} key={industry}>{industry}</Tag>
                            ))}
                        </div>

                        <div className={styles.cardFooter}>
                            <div className={styles.mentorPrice}>
                                {hourly != null ? `$${hourly}/hr` : 'Free'}
                            </div>
                            <Link href={`/mentor/${user.user_id}`}>
                                <Button type="primary" size="middle" className={styles.scheduleButton}>
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
