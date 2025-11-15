// lib/timezone.ts
export function inferTimezoneFromRequest(req: Request, bodyTimezone?: string | null): string | null {
    // 1. 如果前端通过 body 传了明确的 tz（隐藏字段，不给用户改 UI），优先使用
    if (bodyTimezone && typeof bodyTimezone === "string" && bodyTimezone.trim()) {
        return bodyTimezone.trim();
    }

    // 2. 一些常见的 header（Vercel/Cloudflare 之类会塞）
    const h = req.headers;
    const candHeaders = [
        "x-timezone",            // 你可以自己在前端加
        "x-client-timezone",     // 自定义
        "x-vercel-ip-timezone",  // Vercel
        "cf-timezone",           // Cloudflare
    ];

    for (const key of candHeaders) {
        const v = h.get(key);
        if (v && v.trim()) {
            return v.trim();
        }
    }

    // 3. 最后没有就返回 null（后续逻辑不要乱写）
    return null;
}