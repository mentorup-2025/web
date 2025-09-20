/**
 * Profile Test Setup Utilities
 * 
 * This file contains ONLY boilerplate setup code that doesn't contain
 * business logic essential to understanding the tests.
 * 
 * Business logic (like isOwnProfile conditions) should remain in test files.
 */

import { useUser } from '@clerk/nextjs'

// Common mock data structures (data only, no logic)
export const MOCK_MENTOR_DATA = {
  id: 'test-mentor-id',
  username: 'Test Mentor',
  linkedin: 'https://linkedin.com/in/test',
  introduction: 'Test introduction',
  profile_url: 'https://example.com/avatar.jpg',
  mentor: {
    title: 'Software Engineer',
    company: 'Test Company',
    services: [
      { type: 'Free Coffee Chat (15 Mins)', price: 0 },
      { type: '1:1 Mentorship Session', price: 50 }
    ]
  }
}

export const MOCK_MENTEE_DATA = {
  id: 'test-mentee-id',
  username: 'Test Mentee',
  linkedin: 'https://linkedin.com/in/test-mentee',
  introduction: 'Test mentee introduction',
  profile_url: 'https://example.com/mentee-avatar.jpg',
  job_target: {
    level: 'entry',
    title: 'Software Engineer'
  },
  resume_url: null
}

// Free coffee chat service data
export const FREE_COFFEE_SERVICE = { type: 'Free Coffee Chat (15 Mins)', price: 0 }
export const PAID_SESSION_SERVICE = { type: '1:1 Mentorship Session', price: 50 }
export const RESUME_REVIEW_SERVICE = { type: 'Resume Review', price: 25 }

// Service combinations for testing
export const SERVICES_WITH_FREE_COFFEE = [FREE_COFFEE_SERVICE, PAID_SESSION_SERVICE]
export const SERVICES_WITHOUT_FREE_COFFEE = [PAID_SESSION_SERVICE, RESUME_REVIEW_SERVICE]

// Coffee chat count scenarios
export const COFFEE_CHAT_SCENARIOS = {
  UNUSED: 0,    // User hasn't used free coffee chat
  USED_ONCE: 1, // User has used it once
  USED_MULTIPLE: 3, // User has used it multiple times
} as const

// Common user scenarios for mocking (data only)
export const USER_SCENARIOS = {
  OWN_MENTOR_PROFILE: {
    isSignedIn: true,
    user: { id: 'test-mentor-id' },
    isLoaded: true,
  },
  OWN_MENTEE_PROFILE: {
    isSignedIn: true,
    user: { id: 'test-mentee-id' },
    isLoaded: true,
  },
  DIFFERENT_USER: {
    isSignedIn: true,
    user: { id: 'different-user-id' },
    isLoaded: true,
  },
  NOT_SIGNED_IN: {
    isSignedIn: false,
    user: null,
    isLoaded: true,
  },
} as const

// Utility to setup common mocks (boilerplate only)
export function setupProfileTestMocks() {
  const mockUseUser = useUser as jest.MockedFunction<typeof useUser>
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

  return {
    mockUseUser,
    mockFetch,
    resetMocks: () => {
      jest.clearAllMocks()
    }
  }
}

// Common API response mocks (data only)
export function createMockApiResponse(data: any, isSuccess = true, responseType: 'mentor' | 'mentee' = 'mentor') {
  if (isSuccess) {
    if (responseType === 'mentor') {
      // Mentor API returns { data: ... }
      return {
        ok: true,
        json: async () => ({ data }),
      } as Response
    } else {
      // Mentee API returns { code: 200, data: ... }
      return {
        ok: true,
        json: async () => ({ code: 200, data }),
      } as Response
    }
  } else {
    return {
      ok: false,
      json: async () => ({ code: 500, message: 'Error' }),
    } as Response
  }
}

// Common wait conditions (boilerplate only)
export const WAIT_OPTIONS = {
  DEFAULT_TIMEOUT: 10000,
  EXTENDED_TIMEOUT: 15000,
}

// CSS selectors for avatar states (these are implementation details, not business logic)
export const AVATAR_SELECTORS = {
  CLICKABLE: '.ant-avatar[style*="cursor: pointer"]',
  NOT_CLICKABLE: '.ant-avatar[style*="cursor: default"]',
}

// Common test data-testids
export const TEST_IDS = {
  NAVBAR: 'navbar',
  MY_SESSIONS_TAB: 'my-sessions-tab',
  AVAILABILITY_TAB: 'availability-tab',
  PAYMENT_TAB: 'payment-tab',
}
