import { getMentorAvailabilitySetup } from '../../../../lib/availability';
import { respData, respErr } from '../../../../lib/resp';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get mentor availability
    console.log('Getting mentor availability for ID:', params.id);
    const availability = await getMentorAvailabilitySetup(params.id);

    return respData(availability);
  } catch (error) {
    console.error('Error in GET /api/availability/[id]/get:', error);
    return respErr('Failed to fetch mentor availability');
  }
} 