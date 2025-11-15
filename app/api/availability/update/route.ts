// app/api/availability/update/route.ts
import { respErr, respJson, respOk } from "@/lib/resp";
import {
    setRegularAvailabilityV2,
    upsertUserTimezone,
} from "@/lib/availability";
import { SetAvailabilityInput } from "@/types/availability";
import { getUser } from "@/lib/user";
import { auth } from "@clerk/nextjs/server";
import { inferTimezoneFromRequest } from "@/lib/timezone";

export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return respErr("Unauthorized: User not authenticated");
        }

        const rawBody = await request.json();
        const input: SetAvailabilityInput = rawBody;

        if (!input.user_id || !Array.isArray(input.availabilities)) {
            return respJson(400, "Invalid input format");
        }

        if (userId !== input.user_id) {
            return respErr(
                "Unauthorized: User ID from session does not match user_id in request",
            );
        }


        // 1️⃣ 先检查是否是 mentor
        const user = await getUser(input.user_id);
        if (!user?.mentor) {
            throw new Error("User is not a mentor");
        }

        // 2️⃣ 自动探测时区（不需要 UI）
        //    - rawBody.timezone：前端可以用 Intl.DateTimeFormat().resolvedOptions().timeZone 算好塞进 body
        //    - 若前端没传，inferTimezoneFromRequest 会从 header 尝试推断
        const detectedTz = inferTimezoneFromRequest(
            request,
            rawBody.timezone ?? null,
        );

        if (detectedTz) {
            await upsertUserTimezone(userId, detectedTz);
        } else {
            console.warn(
                `No timezone detected for user ${userId}, keep existing value`,
            );
        }

        // 3️⃣ 用 v2：把「本地墙上时间」写入 mentor_weekly_availability_v2
        await setRegularAvailabilityV2(input);

        console.log(
            `Availability (v2) updated for user ${userId} (tz=${detectedTz || "unchanged"})`,
        );
        return respOk();
    } catch (error) {
        console.error("Error updating availability (v2):", error);

        if (
            error instanceof Error &&
            error.message === "Invalid availability slots provided"
        ) {
            return respErr(error.message);
        }

        return respErr("Failed to update availability");
    }
}