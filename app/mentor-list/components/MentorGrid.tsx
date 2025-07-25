'use client';

import { Card, Avatar, Tag, Button, Empty } from 'antd';
import Link from 'next/link';
import { UserOutlined } from '@ant-design/icons';
import styles from '../search.module.css';
import { useEffect, useState } from 'react';
import { Mentor, SearchFiltersType } from '../../../types';
import { isFreeCoffeeChat } from '../../services/constants';


interface MentorGridProps {
  filters: SearchFiltersType;
  mentors: Mentor[];
  loading: boolean;
}

export default function MentorGrid({ filters, mentors, loading }: MentorGridProps) {
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);

  useEffect(() => {
    const filtered = mentors.filter(mentor => {
      // Job title filter (case-insensitive partial match)
      if (filters.jobTitle && !mentor.mentor.title.toLowerCase().includes(filters.jobTitle.toLowerCase())) {
        return false;
      }

      // Industry filter
      if (filters.industries && filters.industries.length > 0) {
        const hasMatchingIndustry = mentor.industries.some(industry => 
          filters.industries?.includes(industry)
        );
        if (!hasMatchingIndustry) return false;
      }

      // Experience filter
      if (filters.minExperience !== undefined && 
          mentor.mentor.years_of_experience < filters.minExperience) {
        return false;
      }
      if (filters.maxExperience !== undefined && 
          mentor.mentor.years_of_experience > filters.maxExperience) {
        return false;
      }

      // Price range filter
      if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
        const servicePrices = Object.values(mentor.mentor.services).map(service => 
          typeof service === 'number' ? service : service.price
        );
        const hasPriceInRange = servicePrices.some(price => 
          price >= filters.minPrice! && price <= filters.maxPrice!
        );
        if (!hasPriceInRange) return false;
      }

      // Service type filter
      if (filters.serviceTypes && filters.serviceTypes.length > 0) {
        const mentorServiceTypes = Object.entries(mentor.mentor.services).map(([key, value]) => 
          typeof value === 'object' ? value.type : key
        );
        const hasMatchingServiceType = mentorServiceTypes.some(type => 
          filters.serviceTypes?.includes(type)
        );
        if (!hasMatchingServiceType) return false;
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
      {filteredMentors.map(user => (
        <Card key={user.user_id} className={styles.mentorCard}>
          <div className={styles.avatarContainer}>
            <Avatar
                size={80}
                src={user.profile_url || undefined}
                icon={!user.profile_url ? <UserOutlined /> : undefined}
                className={styles.avatar}
            />
          </div>
          
          <div className={styles.mentorInfo}>
            <h3>{user.username}</h3>
            <p>{user.mentor.title} at {user.mentor.company}</p>
            <p>{user.mentor.years_of_experience} YOE</p>
          </div>
          
          <div className={styles.mentorTags}>
            {user.industries.map(industry => (
              <Tag className={styles.mentorTag} key={industry}>{industry}</Tag>
            ))}
          </div>
          
          <div className={styles.cardFooter}>
            <div className="text-blue-600 text-lg">
              {(() => {
                const servicesArr = Object.values(user.mentor.services);
                const firstNonCoffeeChat = servicesArr.find(service =>
                  !isFreeCoffeeChat(service.type)
                );
                if (firstNonCoffeeChat) {
                  return `$${firstNonCoffeeChat.price.toString().split('.')[0]}/hour`;
                } else {
                  return '';
                }
              })()}
            </div>
            
            <Link href={`/mentor/${user.user_id}`}>
              <Button type="primary" className={styles.scheduleButton}>
                Schedule
              </Button>
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}