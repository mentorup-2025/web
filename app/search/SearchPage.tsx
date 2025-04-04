'use client';

import { Layout } from 'antd';
import styles from './search.module.css';
import Navbar from '../components/Navbar';
import SearchFilters from './components/SearchFilters';
import MentorGrid from './components/MentorGrid';

const { Content } = Layout;

export default function SearchPage() {
  return (
    <Layout className={styles.layout}>
      <Navbar />
      <Layout className={styles.mainLayout}>
        <SearchFilters />
        <Content className={styles.content}>
          <MentorGrid />
        </Content>
      </Layout>
    </Layout>
  );
} 