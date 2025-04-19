'use client';

import MenteeSignup from '../MenteeSignup';
import styles from '../signupProcess.module.css';

export default function MenteeSignupPage() {
  return (
    <div className={styles.mainLayout}>
      <div className={styles.content}>
        <MenteeSignup />
      </div>
    </div>
  );
} 