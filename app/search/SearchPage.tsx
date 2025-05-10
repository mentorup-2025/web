'use client';

import { Layout } from 'antd';
import styles from './search.module.css';
import Navbar from '../components/Navbar';
import SearchFilters from './components/SearchFilters';
import MentorGrid from './components/MentorGrid';
import { useState, useEffect } from 'react';

const { Content } = Layout;

interface Service {
  type: string;
  price: number;
}

interface Mentor {
  user_id: string;
  username: string;
  email: string;
  industries: string[];
  mentor: {
    title: string;
    introduction: string;
    company: string;
    years_of_experience: number;
    services: {
      [key: string]: Service | number;
    };
    user_id: string;
    created_at: string;
  };
}

interface SearchFilters {
  jobTitle?: string;
  industries?: string[];
  minExperience?: number;
  maxExperience?: number;
  minPrice?: number;
  maxPrice?: number;
}

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/mentor/list');
        const data = await response.json();
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

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  // Extract unique job titles and industries from mentor data
  const uniqueJobTitles = Array.from(new Set(mentors.map(mentor => mentor.mentor.title)));
  const uniqueIndustries = Array.from(new Set(mentors.flatMap(mentor => mentor.industries)));

  // Calculate price range from mentor services
  const allPrices = mentors.flatMap(mentor => 
    Object.values(mentor.mentor.services).map(service => 
      typeof service === 'number' ? service : service.price
    )
  );

  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 200;

  return (
    <Layout className={styles.layout}>
      <Navbar />
      <Layout className={styles.mainLayout}>
        <SearchFilters 
          onFiltersChange={handleFiltersChange} 
          jobTitles={uniqueJobTitles}
          industries={uniqueIndustries}
          minPrice={minPrice}
          maxPrice={maxPrice}
        />
        <Content className={styles.content}>
          <MentorGrid filters={filters} mentors={mentors} loading={loading} />
        </Content>
      </Layout>
    </Layout>
  );
} 