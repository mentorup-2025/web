'use client';

import { useEffect, useMemo, useState } from 'react';
import { SignUpButton, useUser } from '@clerk/nextjs';
import styles from './globalPromoBanner.module.css';

const STORAGE_KEY = 'hide_global_promo_banner_v2';

export default function GlobalPromoBanner() {
    const { isLoaded, isSignedIn, user } = useUser();
    const [visibleGate, setVisibleGate] = useState<boolean | null>(null); // 本地显隐闸门（storage / url）
    const [coffeeChatCount, setCoffeeChatCount] = useState<number | null>(null); // 登录后：已用次数
    const [loadingCoffeeCount, setLoadingCoffeeCount] = useState(false);

    // 1) 本地显隐闸门（与登录状态无关）
    useEffect(() => {
        if (!isLoaded) return;
        const params = new URLSearchParams(window.location.search);
        if (params.get('showBanner') === '1') {
            window.localStorage.removeItem(STORAGE_KEY);
            setVisibleGate(true);
            return;
        }
        const hidden = window.localStorage.getItem(STORAGE_KEY) === '1';
        setVisibleGate(!hidden);
    }, [isLoaded]);

    // 2) 登录后：拉取 coffee chat 次数（0 表示还有 1 次免费名额；>0 表示已用完）
    useEffect(() => {
        if (!isLoaded) return;
        if (!isSignedIn) {
            setCoffeeChatCount(null); // 未登录不需要
            return;
        }
        if (!user?.id) return;

        let aborted = false;
        (async () => {
            try {
                setLoadingCoffeeCount(true);
                const res = await fetch(`/api/user/${user.id}/get_coffee_chat_time`);
                const json = await res.json();
                if (!aborted) {
                    // 后端约定：返回次数（0=还没用；>=1=已用）
                    setCoffeeChatCount(typeof json?.data === 'number' ? json.data : 0);
                }
            } catch {
                if (!aborted) setCoffeeChatCount(0); // 拉取失败时，默认当作还有机会以免误伤（也可置为已用完，看你后端稳定性）
            } finally {
                if (!aborted) setLoadingCoffeeCount(false);
            }
        })();

        return () => {
            aborted = true;
        };
    }, [isLoaded, isSignedIn, user?.id]);

    // 3) 逻辑判定：是否应该显示（除了本地闸门以外）
    const meetsLoginRule = useMemo(() => {
        if (!isSignedIn) return true; // 未登录：允许显示
        // 已登录：只有在还没用免费 coffee chat（次数==0）才显示
        if (coffeeChatCount === null) return false; // 还没拉到数据前不显示，避免闪现
        return coffeeChatCount === 0;
    }, [isSignedIn, coffeeChatCount]);

    // 4) 准备好再渲染，避免闪现
    const ready =
        isLoaded &&
        visibleGate !== null &&
        (!isSignedIn || (!loadingCoffeeCount && coffeeChatCount !== null));

    const finalVisible = ready && visibleGate && meetsLoginRule;
    if (!finalVisible) return null;

    return (
        <div className={styles.banner}>
            <div className={styles.content}>
        <span className={styles.text}>
          Unlock 20% OFF your first order with code{' '}
            <strong className={styles.code}>
            <code>HIMENTORUP20</code>
          </strong>{' '}
            + enjoy a FREE coffee chat with a mentor.
            {/* 未登录：显示注册按钮；已登录：不显示 */}
            {!isSignedIn && (
                <SignUpButton mode="modal">
                    <span className={styles.link}>Register now!</span>
                </SignUpButton>
            )}
        </span>
                <button
                    className={styles.close}
                    aria-label="Close banner"
                    onClick={() => {
                        // 关闭后本地不再显示
                        window.localStorage.setItem(STORAGE_KEY, '1');
                        // 立即隐藏
                        setVisibleGate(false);
                    }}
                >
                    ×
                </button>
            </div>
        </div>
    );
}
