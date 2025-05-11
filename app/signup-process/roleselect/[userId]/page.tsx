'use client';

import RoleSelect from '../../RoleSelect';
import Navbar from '../../../components/Navbar';
import styles from '../../signupProcess.module.css';

export default function RoleSelectPage({ params }: { params: { userId: string } }) {
  return (
    <>
      <Navbar />
      <div className={styles.mainLayout}>
        <div className={styles.content}>
          <RoleSelect userId={params.userId} />
        </div>
      </div>
    </>
  );
} 