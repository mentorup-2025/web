'use client';

import MentorSignup from '../MentorSignup';
import styles from '../signupProcess.module.css';

export default function MentorSignupPage() {
  return (
    <div className={styles.mainLayout}>
      <div className={styles.content}>
        <MentorSignup />
      </div>
    </div>
  );
} 