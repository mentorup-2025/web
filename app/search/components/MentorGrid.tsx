'use client';

import { Card, Avatar, Tag, Button } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import styles from '../search.module.css';

export default function MentorGrid() {
  const mentors = [
    {
      id: 1,
      name: 'John Doe',
      title: 'Senior Software Engineer',
      company: 'Google',
      price: 100,
      tags: ['React', 'Node.js', 'Python']
    },
    {
      id: 2,
      name: 'Jane Smith',
      title: 'Product Manager',
      company: 'Microsoft',
      price: 150,
      tags: ['Product Strategy', 'Agile', 'UX']
    },
    {
      id: 3,
      name: 'Mike Johnson',
      title: 'Data Scientist',
      company: 'Amazon',
      price: 120,
      tags: ['Machine Learning', 'Python', 'SQL']
    },
    {
      id: 4,
      name: 'Sarah Williams',
      title: 'UX Designer',
      company: 'Apple',
      price: 90,
      tags: ['UI/UX', 'Figma', 'User Research']
    },
    {
      id: 5,
      name: 'David Brown',
      title: 'Frontend Engineer',
      company: 'Facebook',
      price: 110,
      tags: ['React', 'TypeScript', 'CSS']
    },
    {
      id: 6,
      name: 'Emily Davis',
      title: 'Backend Engineer',
      company: 'Netflix',
      price: 130,
      tags: ['Java', 'Spring', 'Microservices']
    }
  ];

  return (
    <div className={styles.mentorGrid}>
      {mentors.map(mentor => (
        <Card key={mentor.id} className={styles.mentorCard}>
          <div className={styles.avatarContainer}>
            <Avatar 
              size={80} 
              icon={<UserOutlined />} 
              className={styles.avatar}
            />
          </div>
          
          <div className={styles.mentorInfo}>
            <h3>{mentor.name}</h3>
            <p>{mentor.title}</p>
            <p>{mentor.company}</p>
          </div>
          
          <div className={styles.mentorTags}>
            {mentor.tags.map(tag => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
          
          <div className={styles.cardFooter}>
            <span className={styles.mentorPrice}>
              ${mentor.price}/hour
            </span>
            <Button type="primary" className={styles.scheduleButton}>
              Schedule
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
} 