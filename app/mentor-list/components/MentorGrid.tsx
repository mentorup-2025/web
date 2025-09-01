'use client';

import { Card, Avatar, Tag, Button, Empty, Image } from 'antd';
import Link from 'next/link';
import { UserOutlined } from '@ant-design/icons';
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

export default function MentorGrid({ filters, mentors, loading }: MentorGridProps) {
    const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);

    useEffect(() => {
        const filtered = mentors.filter(mentor => {
            // Job Title
            if (filters.jobTitle && !mentor.mentor.title?.toLowerCase().includes(filters.jobTitle.toLowerCase())) {
                return false;
            }

            // Industry
            if (filters.industries?.length) {
                const ok = mentor.industries?.some(i => filters.industries!.includes(i));
                if (!ok) return false;
            }

            // Company
            if (filters.company?.length) {
                if (!filters.company.includes(mentor.mentor.company)) return false;
            }

            // YOE
            const yoe = Number(mentor.mentor.years_of_experience ?? 0);
            if (filters.minExperience != null && yoe < Number(filters.minExperience)) return false;
            if (filters.maxExperience != null && yoe > Number(filters.maxExperience)) return false;

            // Price
            if (filters.minPrice != null || filters.maxPrice != null) {
                const minP = filters.minPrice != null ? Number(filters.minPrice) : -Infinity;
                const maxP = filters.maxPrice != null ? Number(filters.maxPrice) : Infinity;
                const entries = extractServiceEntries(mentor.mentor.services);
                const hit = entries.some(e => e.price >= minP && e.price <= maxP);
                if (!hit) return false;
            }

            // Service Type
            if (filters.serviceTypes?.length) {
                const entries = extractServiceEntries(mentor.mentor.services);
                const types = entries.map(e => e.type);
                if (!types.some(t => filters.serviceTypes!.includes(t))) return false;
            }

            return true;
        });

        setFilteredMentors(filtered);
    }, [mentors, filters]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (filteredMentors.length === 0) {
        return (
            <div className={styles.noResults}>
                <Empty
                    description={
                        <span>
              No mentors found matching your criteria. <br />
              Please try adjusting your filters.
            </span>
                    }
                />
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
                    <Card key={user.user_id} className={styles.mentorCard}>
                        <div className={styles.avatarContainer}>
                            {user.profile_url ? (
                                <Image
                                    src={user.profile_url}
                                    alt={user.username}
                                    className={styles.avatar}
                                    preview={false}
                                    fallback="/default-avatar.png" // 可选：添加默认头像
                                />
                            ) : (
                                <div className={styles.avatar} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#f0f0f0',
                                    color: '#999',
                                    fontSize: '48px'
                                }}>
                                    <UserOutlined />
                                </div>
                            )}
                        </div>

                        <div className={styles.mentorInfo}>
                            <h3>{user.username}</h3>
                            <p>{user.mentor.title} at {user.mentor.company}</p>
                            <p>{user.mentor.years_of_experience} YOE</p>
                        </div>

                        <div className={styles.mentorTags}>
                            {user.industries.slice(0, 3).map(industry => (
                                <Tag className={styles.mentorTag} key={industry}>{industry}</Tag>
                            ))}
                            {user.industries.length > 3 && (
                                <Tag>+{user.industries.length - 3}</Tag>
                            )}
                        </div>

                        <div className={styles.cardFooter}>
                            <div className="text-blue-600 text-lg font-semibold">
                                {hourly != null ? `$${hourly}/hour` : 'Free'}
                            </div>

                            <Link href={`/mentor/${user.user_id}`}>
                                <Button type="primary" className={styles.scheduleButton}>
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