'use client';

import { Card, Avatar, Rate, Tag } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import styles from '../search.module.css';

export default function MentorGrid() {
  const mentors = [
    {
      id: 1,
      name: 'John Doe',
      title: 'Senior Software Engineer',
      company: 'Google',
      rating: 4.5,
      price: 100,
      tags: ['React', 'Node.js', 'Python']
    },
    {
      id: 2,
      name: 'Jane Smith',
      title: 'Product Manager',
      company: 'Microsoft',
      rating: 5,
      price: 150,
      tags: ['Product Strategy', 'Agile', 'UX']
    },
    {
      id: 3,
      name: 'Mike Johnson',
      title: 'Data Scientist',
      company: 'Amazon',
      rating: 4.8,
      price: 120,
      tags: ['Machine Learning', 'Python', 'SQL']
    },
    {
      id: 4,
      name: 'Sarah Williams',
      title: 'UX Designer',
      company: 'Apple',
      rating: 4.7,
      price: 90,
      tags: ['UI/UX', 'Figma', 'User Research']
    },
    {
      id: 5,
      name: 'David Brown',
      title: 'Frontend Engineer',
      company: 'Facebook',
      rating: 4.6,
      price: 110,
      tags: ['React', 'TypeScript', 'CSS']
    },
    {
      id: 6,
      name: 'Emily Davis',
      title: 'Backend Engineer',
      company: 'Netflix',
      rating: 4.9,
      price: 130,
      tags: ['Java', 'Spring', 'Microservices']
    }
  ];

  return (
    <div className={styles.mentorGrid}>
      {mentors.map(mentor => (
        <Card key={mentor.id} className={styles.mentorCard}>
          <div className={styles.mentorHeader}>
            <Avatar size={64} icon={<UserOutlined />} />
            <div className={styles.mentorInfo}>
              <h3>{mentor.name}</h3>
              <p>{mentor.title}</p>
              <p>{mentor.company}</p>
            </div>
          </div>
          
          <Rate disabled defaultValue={mentor.rating} />
          
          <div className={styles.mentorTags}>
            {mentor.tags.map(tag => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
          
          <div className={styles.mentorPrice}>
            ${mentor.price}/hour
          </div>
        </Card>
      ))}
    </div>
  );
} 