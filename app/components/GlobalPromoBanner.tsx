'use client';

import { useEffect, useState } from 'react';
import { SignedOut, SignUpButton, useUser } from '@clerk/nextjs';
import styles from './globalPromoBanner.module.css';

const STORAGE_KEY = 'hide_global_promo_banner_v2';

export default function GlobalPromoBanner() {
    const { isLoaded } = useUser();             // 👈 等待 Clerk 就绪
    const [visible, setVisible] = useState<boolean | null>(null);

    useEffect(() => {
        if (!isLoaded) return;                    // 👈 未就绪不做任何渲染/判断
        const params = new URLSearchParams(window.location.search);
        if (params.get('showBanner') === '1') {
            window.localStorage.removeItem(STORAGE_KEY);
            setVisible(true);
            return;
        }
        const hidden = window.localStorage.getItem(STORAGE_KEY) === '1';
        setVisible(!hidden);
    }, [isLoaded]);

    const onClose = () => {
        setVisible(false);
        window.localStorage.setItem(STORAGE_KEY, '1');
    };

    // 1) Clerk 未加载好 → 不渲染，避免闪现
    // 2) 决策未完成 or 已选择隐藏 → 不渲染
    if (!isLoaded || visible === null || !visible) return null;

    // 只在“未登录”时才渲染（已登录时 <SignedOut> 不会输出任何内容）
    return (
        <SignedOut>
            <div className={styles.banner}>
                <div className={styles.content}>
          <span className={styles.text}>
            Unlock 20% OFF your first order with code{' '}
              <strong className={styles.code}><code>HIMENTORUP20</code></strong>{' '}
              + enjoy a FREE coffee chat with a mentor.{' '}
              <SignUpButton mode="modal">
              <span className={styles.link}>Register now!</span>
            </SignUpButton>
          </span>
                    <button className={styles.close} aria-label="Close banner" onClick={onClose}>×</button>
                </div>
            </div>
        </SignedOut>
    );
}
