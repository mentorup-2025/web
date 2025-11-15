'use client';

import { useEffect } from 'react';

export default function TimezoneSyncProvider({ userId }: { userId: string | null }) {
    useEffect(() => {
        if (!userId) return;

        const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

        (async () => {
            try {
                // 1) 获取数据库中的时区
                const res = await fetch(`/api/user/${userId}/timezone`);
                const json = await res.json();
                const dbTz = json.data?.timezone;

                // 2) 如果不一样，则更新
                if (dbTz !== localTz) {
                    await fetch(`/api/user/${userId}/timezone`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ timezone: localTz }),
                    });
                    console.log(`Timezone updated: ${dbTz} → ${localTz}`);
                }
            } catch (e) {
                console.error('Timezone sync failed', e);
            }
        })();
    }, [userId]);

    return null;
}