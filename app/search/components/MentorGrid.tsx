'use client';

import { Card, Avatar, Tag, Button, Empty } from 'antd';
import Link from 'next/link';
import { UserOutlined } from '@ant-design/icons';
import styles from '../search.module.css';
import { useEffect, useState } from 'react';

interface Mentor {
  user_id: string;
  username: string;
  email: string;
  mentor: {
    title: string;
    introduction: string;
    company: string;
    years_of_experience: number;
    industries: string[];
    services: {
      consultation: number;
      resume_review: number;
      mock_interview: number;
      career_guidance: number;
    };
    user_id: string;
    created_at: string;
  };
}

interface ApiResponse {
  code: number;
  message: string;
  data: Mentor[];
}

interface SearchFilters {
  jobTitle?: string;
  industries?: string[];
  minExperience?: number;
  maxExperience?: number;
  minPrice?: number;
  maxPrice?: number;
}

interface MentorGridProps {
  filters: SearchFilters;
}

export default function MentorGrid({ filters }: MentorGridProps) {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/mentor/list');
        const data: ApiResponse = await response.json();
        if (data.code === 200) {
          setMentors(data.data);
          setFilteredMentors(data.data);
        }
      } catch (error) {
        console.error('Error fetching mentors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  useEffect(() => {
    const filtered = mentors.filter(mentor => {
      // Job title filter (case-insensitive partial match)
      if (filters.jobTitle && !mentor.mentor.title.toLowerCase().includes(filters.jobTitle.toLowerCase())) {
        return false;
      }

      // Industry filter
      if (filters.industries && filters.industries.length > 0) {
        const hasMatchingIndustry = mentor.mentor.industries.some(industry => 
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
        const servicePrices = Object.values(mentor.mentor.services);
        const hasPriceInRange = servicePrices.some(price => 
          price >= filters.minPrice! && price <= filters.maxPrice!
        );
        if (!hasPriceInRange) return false;
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
              icon={<UserOutlined />} 
              className={styles.avatar}
            />
          </div>
          
          <div className={styles.mentorInfo}>
            <h3>{user.username}</h3>
            <p>{user.mentor.title} at {user.mentor.company}</p>
            <p>{user.mentor.years_of_experience} YOE</p>
          </div>
          
          <div className={styles.mentorTags}>
            {user.mentor.industries.map(industry => (
              <Tag key={industry}>{industry}</Tag>
            ))}
          </div>
          
          <div className={styles.cardFooter}>
            {/* Removed price since it's not in the API response */}
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