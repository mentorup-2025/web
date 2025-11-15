import { respData, respErr } from '@/lib/resp';
import { NextRequest } from 'next/server';
import { getMentorAvailabilitySetupV2 } from '@/lib/availability';
import { getUser } from '@/lib/user';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
  try {
    console.log('Getting mentor availability (v2) for ID:', params.id);

    const [availability, user] = await Promise.all([
      getMentorAvailabilitySetupV2(params.id),
      getUser(params.id)
    ]);

    return respData({
      timezone: user?.timezone ?? 'UTC',
      availabilities: availability
    });
  } catch (error) {
    console.error('Error in GET /api/availability/[id]/get (v2):', error);
    return respErr('Failed to fetch mentor availability');
  }
}