'use client';

import { Layout } from 'antd';
import Navbar from '../components/Navbar';
import MentorSignup from './MentorSignup';
import styles from './signupProcess.module.css';

const { Content } = Layout;

export default function SignupProcess() {
  return (
    <Layout className={styles.layout}>
      <Navbar />
      <Layout className={styles.mainLayout}>
        <Content className={styles.content}>
          <MentorSignup />
        </Content>
      </Layout>
    </Layout>
  );
} 