'use client';

import MentorSignup from '../../MentorSignup';
import styles from '../../signupProcess.module.css';
import Navbar from '../../../components/Navbar';

export default function MentorSignupPage({ params }: { params: { userId: string } }) {
  return (
    <>
      <Navbar />
      <div className={styles.mainLayout}>
        <div className={styles.content}>
          <MentorSignup userId={params.userId} />
        </div>
      </div>
    </>
  );
} 