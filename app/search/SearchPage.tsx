'use client';

import { Layout } from 'antd';
import styles from './search.module.css';
import Navbar from '../components/Navbar';
import SearchFilters from './components/SearchFilters';
import MentorGrid from './components/MentorGrid';
import { useState } from 'react';

const { Content } = Layout;

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

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  return (
    <Layout className={styles.layout}>
      <Navbar />
      <Layout className={styles.mainLayout}>
        <SearchFilters onFiltersChange={handleFiltersChange} />
        <Content className={styles.content}>
          <MentorGrid filters={filters} />
        </Content>
      </Layout>
    </Layout>
  );
} 