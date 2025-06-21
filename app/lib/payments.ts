export async function getEarnings(userId: string): Promise<number> {
    const res = await fetch(`/api/appointments?user_id=${encodeURIComponent(userId)}`);
    if (!res.ok) {
        throw new Error(`Fetch earnings failed (${res.status})`);
    }
    const json = await res.json();
    // 后端返回 { earnings: number }
    return typeof json.earnings === 'number' ? json.earnings : 0;
}

export async function getPaidOut(userId: string): Promise<number> {
    const res = await fetch(`/api/paidOut?user_id=${encodeURIComponent(userId)}`);
    if (!res.ok) {
        throw new Error(`Fetch paidOut failed (${res.status})`);
    }
    const json = await res.json();
    // 后端返回 { paidOut: number }
    return typeof json.paidOut === 'number' ? json.paidOut : 0;
}