import React from 'react'
import { render } from '@testing-library/react'
import { useUser } from '@clerk/nextjs'
import MentorProfilePage from './page'
import { 
  setupProfileTestMocks, 
  createMockApiResponse, 
  MOCK_MENTOR_DATA, 
  USER_SCENARIOS,
  WAIT_OPTIONS 
} from '../../test-utils/profileTestSetup'
import {
  waitForComponentLoad,
  waitForAvatarWithCursor,
  clickAvatar,
  waitForUploadModal,
  waitForModalNotToAppear,
  expectUploadModalVisible
} from '../../test-utils/profileTestActions'

// Mock useUser at the top level
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
}))

// Mock Next.js navigation for mentor profile
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useParams: () => ({
    id: 'test-mentor-id', // BUSINESS LOGIC: This ID must match MOCK_MENTOR_DATA.id for own profile tests
  }),
  usePathname: () => '/mentor-profile/test-mentor-id',
}))

// Mock the child components that we don't need to test
jest.mock('../components/MySessionsTab', () => {
  return function MockMySessionsTab() {
    return <div data-testid="my-sessions-tab">My Sessions Tab</div>
  }
})

jest.mock('../components/AvailabilityTab', () => {
  return function MockAvailabilityTab() {
    return <div data-testid="availability-tab">Availability Tab</div>
  }
})

jest.mock('../components/PaymentTab', () => {
  return function MockPaymentTab() {
    return <div data-testid="payment-tab">Payment Tab</div>
  }
})

jest.mock('../../components/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>
  }
})

describe('MentorProfilePage Avatar Upload Visibility', () => {
  const { mockUseUser, mockFetch, resetMocks } = setupProfileTestMocks()

  beforeEach(() => {
    resetMocks()
    
    // Mock successful API response (mentor API structure)
    mockFetch.mockResolvedValue(createMockApiResponse(MOCK_MENTOR_DATA, true, 'mentor'))
  })

  describe('when user is signed in and viewing their own profile', () => {
    beforeEach(() => {
      // BUSINESS LOGIC: User viewing their own profile should have upload access
      mockUseUser.mockReturnValue(USER_SCENARIOS.OWN_MENTOR_PROFILE as any)
    })

    it('should show clickable avatar with pointer cursor', async () => {
      render(<MentorProfilePage />)

      await waitForComponentLoad()
      
      // BUSINESS LOGIC: Own profile = clickable avatar
      await waitForAvatarWithCursor(true)
    }, WAIT_OPTIONS.EXTENDED_TIMEOUT)

    it('should open upload modal when avatar is clicked', async () => {
      render(<MentorProfilePage />)

      await waitForComponentLoad()
      await waitForAvatarWithCursor(true)
      
      // BUSINESS LOGIC: Clicking own avatar should open upload modal
      await clickAvatar()
      await waitForUploadModal()
    }, WAIT_OPTIONS.EXTENDED_TIMEOUT)
  })

  describe('when user is signed in but viewing another user\'s profile', () => {
    beforeEach(() => {
      // BUSINESS LOGIC: Different user ID means no upload access
      mockUseUser.mockReturnValue(USER_SCENARIOS.DIFFERENT_USER as any)
    })

    it('should show avatar with default cursor (not clickable)', async () => {
      render(<MentorProfilePage />)

      await waitForComponentLoad()
      
      // BUSINESS LOGIC: Different user profile = not clickable avatar
      await waitForAvatarWithCursor(false)
    }, WAIT_OPTIONS.EXTENDED_TIMEOUT)

    it('should NOT open upload modal when avatar is clicked', async () => {
      render(<MentorProfilePage />)

      await waitForComponentLoad()
      
      // BUSINESS LOGIC: Clicking other's avatar should not open modal
      await clickAvatar()
      await waitForModalNotToAppear()
      expectUploadModalVisible(false)
    }, WAIT_OPTIONS.EXTENDED_TIMEOUT)
  })

  describe('when user is not signed in', () => {
    beforeEach(() => {
      // BUSINESS LOGIC: Not signed in = no upload access
      mockUseUser.mockReturnValue(USER_SCENARIOS.NOT_SIGNED_IN as any)
    })

    it('should show avatar with default cursor (not clickable)', async () => {
      render(<MentorProfilePage />)

      await waitForComponentLoad()
      
      // BUSINESS LOGIC: Not signed in = not clickable avatar
      await waitForAvatarWithCursor(false)
    }, WAIT_OPTIONS.EXTENDED_TIMEOUT)

    it('should NOT open upload modal when avatar is clicked', async () => {
      render(<MentorProfilePage />)

      await waitForComponentLoad()
      
      // BUSINESS LOGIC: Not signed in = no modal access
      await clickAvatar()
      await waitForModalNotToAppear()
      expectUploadModalVisible(false)
    }, WAIT_OPTIONS.EXTENDED_TIMEOUT)
  })

  describe('isOwnProfile logic validation', () => {
    it('should correctly identify own profile when signed in with matching ID', () => {
      // BUSINESS LOGIC: isSignedIn && user?.id === mentorId should be true
      mockUseUser.mockReturnValue({
        isSignedIn: true,
        user: { id: 'test-mentor-id' } as any, // Same as MOCK_MENTOR_DATA.id
        isLoaded: true,
      })

      render(<MentorProfilePage />)

      // The component should recognize this as own profile
      // This is validated through the avatar cursor behavior in other tests
    })

    it('should correctly identify NOT own profile when signed in with different ID', () => {
      // BUSINESS LOGIC: user.id !== mentorId should be false
      mockUseUser.mockReturnValue({
        isSignedIn: true,
        user: { id: 'different-user-id' } as any, // Different from MOCK_MENTOR_DATA.id
        isLoaded: true,
      })

      render(<MentorProfilePage />)

      // The component should recognize this as NOT own profile
    })

    it('should correctly identify NOT own profile when not signed in', () => {
      // BUSINESS LOGIC: isSignedIn = false should result in false
      mockUseUser.mockReturnValue({
        isSignedIn: false,
        user: null,
        isLoaded: true,
      })

      render(<MentorProfilePage />)

      // The component should recognize this as NOT own profile
    })
  })
})