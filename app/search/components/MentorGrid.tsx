'use client';

import { Card, Avatar, Tag, Button } from 'antd';
import Link from 'next/link';
import { UserOutlined } from '@ant-design/icons';
import styles from '../search.module.css';
import { useEffect, useState } from 'react';

interface Mentor {
  user_id: string;
  username: string;
  email: string;
  mentor: {
    role: string;
    industry: string;
    user_id: string;
    created_at: string;
  };
}

interface ApiResponse {
  code: number;
  message: string;
  data: Mentor[];
}

export default function MentorGrid() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/mentor/list');
        const data: ApiResponse = await response.json();
        if (data.code === 200) {
          setMentors(data.data);
        }
      } catch (error) {
        console.error('Error fetching mentors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.mentorGrid}>
      {mentors.map(mentor => (
        <Card key={mentor.user_id} className={styles.mentorCard}>
          <div className={styles.avatarContainer}>
            <Avatar 
              size={80} 
              icon={<UserOutlined />} 
              className={styles.avatar}
            />
          </div>
          
          <div className={styles.mentorInfo}>
            <h3>{mentor.username}</h3>
            <p>{mentor.mentor.role}</p>
            <p>{mentor.mentor.industry}</p>
          </div>
          
          <div className={styles.mentorTags}>
            <Tag>{mentor.mentor.industry}</Tag>
          </div>
          
          <div className={styles.cardFooter}>
            {/* Removed price since it's not in the API response */}
            <Link href={`/mentor/${mentor.user_id}`}>
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