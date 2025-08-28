'use client';

import { useEffect, useState } from 'react';
import { SignUpButton } from "@clerk/nextjs";
import Link from 'next/link';
import styles from './globalPromoBanner.module.css';

const STORAGE_KEY = 'hide_global_promo_banner_v1';

export default function GlobalPromoBanner() {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hidden = window.localStorage.getItem(STORAGE_KEY);
            if (hidden === '1') setVisible(false);
        }
    }, []);

    const onClose = () => {
        setVisible(false);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(STORAGE_KEY, '1');
        }
    };

    if (!visible) return null;

    return (
        <div className={styles.banner}>
            <div className={styles.content}>
        <span className={styles.text}>
          Unlock 20% OFF your first order with code{' '}
            <strong className={styles.code}>
            <code>HIMENTORUP20</code>
          </strong>{' '}
            + enjoy a FREE coffee chat with a mentor.{' '}
            <SignUpButton mode="modal">
  <span className={styles.link}>Register now!</span>
</SignUpButton>
        </span>

                <button className={styles.close} aria-label="Close banner" onClick={onClose}>
                    ×
                </button>
            </div>
        </div>
    );
}
