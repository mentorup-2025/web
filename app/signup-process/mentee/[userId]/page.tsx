'use client';

import MenteeSignup from '../../MenteeSignup';
import Navbar from '../../../components/Navbar';
import styles from '../../signupProcess.module.css';

export default function MenteeSignupPage({ params }: { params: { userId: string } }) {
  return (
    <>
      <Navbar />
      <div className={styles.mainLayout}>
      <div className={styles.content}>
        <MenteeSignup userId={params.userId} />
      </div>
    </div>
    </>
    
  );
} 