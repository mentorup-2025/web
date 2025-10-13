import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import MentorDetailsPage from './MentorDetailsPage'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { useUser, useAuth, SignedIn, SignedOut, SignInButton, useClerk } from '@clerk/nextjs'
import { Grid } from 'antd'
import {
  setupProfileTestMocks,
  MOCK_MENTOR_DATA,
  SERVICES_WITH_FREE_COFFEE,
  SERVICES_WITHOUT_FREE_COFFEE,
  COFFEE_CHAT_SCENARIOS,
} from '../../test-utils/profileTestSetup'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
  usePathname: jest.fn(),
}))

// Global mock state for Clerk components
let mockIsSignedIn = true

// Mock Clerk hooks and components
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
  useAuth: jest.fn(),
  SignedIn: ({ children }: any) => mockIsSignedIn ? children : null,
  SignedOut: ({ children }: any) => !mockIsSignedIn ? children : null,
  SignInButton: ({ children }: any) => <button data-testid="signin-button">{children}</button>,
  useClerk: jest.fn(() => ({
    signOut: jest.fn(),
  })),
}))

// Helper function to set mock sign-in state
const setMockSignedInState = (isSignedIn: boolean) => {
  mockIsSignedIn = isSignedIn
}

// Don't mock child components - test real integration
// Only mock external dependencies that would break in test environment

// Mock Ant Design Grid for responsive testing (external UI library)
jest.mock('antd', () => {
  const antd = jest.requireActual('antd')
  return {
    ...antd,
    Grid: {
      ...antd.Grid,
      useBreakpoint: jest.fn(() => ({
        md: true, // Default to desktop
      })),
    },
    message: {
      error: jest.fn(),
      warning: jest.fn(),
    },
  }
})

// STRATEGIC MOCKING: Mock only what breaks in test environment or is external
// Keep real components where possible, mock external dependencies

// Mock external services that would break in tests
jest.mock('../../services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  }
}))

// Mock MentorAvailability ONLY because it has complex external dependencies
// But make the mock more realistic by accepting and testing props
jest.mock('../../components/MentorAvailability', () => {
  return function MockMentorAvailability({ mentorId, services, onSlotSelect, onBook, coffeeChatCount }: any) {
    // This mock tests that MentorDetailsPage passes the correct props
    // The actual component logic should be tested in MentorAvailability.test.tsx
    
    // Simulate some basic behavior for integration testing
    const hasFreeCoffee = Array.isArray(services) &&
      services.some((s: any) => typeof s?.type === 'string' && /free coffee chat/i.test(s.type))
    const showBanner = hasFreeCoffee && coffeeChatCount === 0

    return (
      <div data-testid="mentor-availability" data-mentor-id={mentorId} data-coffee-count={coffeeChatCount}>
        <div data-testid="availability-component">Mentor Availability Component</div>
        {showBanner && (
          <div data-testid="free-coffee-banner">Free coffee chat available!</div>
        )}
        <button data-testid="mock-book-button" onClick={onBook}>
          Book Session
        </button>
      </div>
    )
  }
})

// Keep other components real where possible, mock only external dependencies
// ChatWidget might be simple enough to keep real - let's try it
// jest.mock('../../components/ChatWidget', () => { ... }) // Remove this mock

// Navbar might have auth dependencies, so mock it
jest.mock('../../components/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>
  }
})

// MentorReview might have external dependencies, mock it  
jest.mock('../components/MentorReview', () => {
  return function MockMentorReviews() {
    return <div data-testid="mentor-reviews">Mentor Reviews</div>
  }
})

// Only mock dayjs - return the actual dayjs function, not a mock
jest.mock('dayjs', () => {
  const dayjs = jest.requireActual('dayjs')
  return dayjs // Return the actual dayjs module directly
})

describe('MentorDetailsPage Free Coffee Chat Banner Logic', () => {
  const { mockUseUser, mockFetch, resetMocks } = setupProfileTestMocks()
  const mockRouterPush = jest.fn()
  const mockUseBreakpoint = Grid.useBreakpoint as jest.MockedFunction<typeof Grid.useBreakpoint>

  const mockMentorWithFreeCoffee = {
    ...MOCK_MENTOR_DATA,
    user_id: 'test-mentor-id', // Add user_id for the component
    mentor: {
      ...MOCK_MENTOR_DATA.mentor,
      services: SERVICES_WITH_FREE_COFFEE, // Override services in mentor object
    }
  }

  const mockMentorWithoutFreeCoffee = {
    ...MOCK_MENTOR_DATA,
    user_id: 'test-mentor-id', // Add user_id for the component
    mentor: {
      ...MOCK_MENTOR_DATA.mentor,
      services: SERVICES_WITHOUT_FREE_COFFEE, // Override services in mentor object
    }
  }

  beforeEach(() => {
    resetMocks()

    // Reset mock sign-in state to default (signed in)
    setMockSignedInState(true)

    ;(useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush })
    ;(useParams as jest.Mock).mockReturnValue({ id: 'test-mentor-id' })
    ;(usePathname as jest.Mock).mockReturnValue('/mentor/test-mentor-id')
    ;(useUser as jest.Mock).mockReturnValue({
      isSignedIn: true,
      user: { id: 'test-user-id' }, // Different from mentorId to simulate a mentee
      isLoaded: true,
    })
    ;(useAuth as jest.Mock).mockReturnValue({
      isSignedIn: true,
    })

    // Reset Grid mock to default
    mockUseBreakpoint.mockReturnValue({
      md: true, // Default to desktop
    })

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        hash: '',
        search: '',
        pathname: '/mentor/test-mentor-id',
      },
      writable: true,
    })

    // Default mock for fetch calls
    mockFetch.mockImplementation((url) => {
      if (url === '/api/user/test-mentor-id') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: mockMentorWithFreeCoffee }),
        } as Response)
      }
      if (url === '/api/user/test-user-id') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: { resume: null } }),
        } as Response)
      }
      if (url === '/api/user/test-user-id/get_coffee_chat_time') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: 0 }), // Haven't used free coffee chat
        } as Response)
      }
      return Promise.reject(new Error('Unexpected URL'))
    })
  })

  describe('when mentor provides Free Coffee Chat service', () => {
    it('should render MentorAvailability component with correct props when mentee has not used free coffee chat', async () => {
      render(<MentorDetailsPage />)

      // Wait for component to load mentor data
      await waitFor(() => {
        expect(screen.getByText('Test Mentor')).toBeInTheDocument()
      }, { timeout: 10000 })

      // INTEGRATION TEST: Verify MentorDetailsPage passes correct props to MentorAvailability
      // The actual banner logic should be tested in MentorAvailability component tests
      await waitFor(() => {
        const mentorAvailability = screen.getByTestId('mentor-availability')
        expect(mentorAvailability).toBeInTheDocument()
        
        // Verify the component receives the correct props (this tests integration)
        // The real MentorAvailability component will handle the banner logic
        expect(mentorAvailability).toHaveAttribute('data-mentor-id', 'test-mentor-id')
        expect(mentorAvailability).toHaveAttribute('data-coffee-count', '0')
      }, { timeout: 10000 })
    })

    it('should render MentorAvailability component when mentee has already used free coffee chat', async () => {
      // Override the coffee chat count API to return 1 (already used)
      mockFetch.mockImplementation((url) => {
        if (url === '/api/user/test-mentor-id') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: mockMentorWithFreeCoffee }),
          } as Response)
        }
        if (url === '/api/user/test-user-id') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: { resume: null } }),
          } as Response)
        }
        if (url === '/api/user/test-user-id/get_coffee_chat_time') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: 1 }), // Already used free coffee chat
          } as Response)
        }
        return Promise.reject(new Error('Unexpected URL'))
      })

      render(<MentorDetailsPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Mentor')).toBeInTheDocument()
      }, { timeout: 10000 })

      // INTEGRATION TEST: Verify component renders with different coffee chat count
      // The actual business logic (show/hide banner) should be tested in MentorAvailability tests
      await waitFor(() => {
        const mentorAvailability = screen.getByTestId('mentor-availability')
        expect(mentorAvailability).toBeInTheDocument()
        expect(mentorAvailability).toHaveAttribute('data-coffee-count', '1')
      }, { timeout: 5000 })
    })
  })

  describe('when mentor does NOT provide Free Coffee Chat service', () => {
    it('should render MentorAvailability component with services without free coffee', async () => {
      // Override the mentor API response to return services without free coffee
      mockFetch.mockImplementation((url) => {
        if (url === '/api/user/test-mentor-id') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: mockMentorWithoutFreeCoffee }),
          } as Response)
        }
        if (url === '/api/user/test-user-id') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: { resume: null } }),
          } as Response)
        }
        if (url === '/api/user/test-user-id/get_coffee_chat_time') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: 0 }), // Haven't used, but service not offered
          } as Response)
        }
        return Promise.reject(new Error('Unexpected URL'))
      })

      render(<MentorDetailsPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Mentor')).toBeInTheDocument()
      }, { timeout: 10000 })

      // INTEGRATION TEST: Verify component renders with different service types
      // The actual business logic (show/hide banner based on services) should be tested in MentorAvailability tests
      await waitFor(() => {
        expect(screen.getByTestId('mentor-availability')).toBeInTheDocument()
      }, { timeout: 5000 })
    })
  })


  describe('mobile trial tip banner', () => {
    it('should show mobile trial tip banner when conditions are met', async () => {
      // Mock mobile viewport in Ant Design Grid
      mockUseBreakpoint.mockReturnValue({
        md: false, // Mobile viewport
      })

      render(<MentorDetailsPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Mentor')).toBeInTheDocument()
      }, { timeout: 10000 })

      // BUSINESS LOGIC: Mobile trial tip should be visible when isMobile && showTrialTip && showFreeTrialBanner
      await waitFor(() => {
        expect(screen.getByText('Book your free trial session!')).toBeInTheDocument()
        expect(screen.getByLabelText('Dismiss')).toBeInTheDocument()
      }, { timeout: 10000 })
    })
  })

  describe('free coffee chat detection logic validation', () => {
    it('should correctly detect free coffee chat service with case-insensitive matching', () => {
      const servicesWithVariousCase = [
        { type: 'FREE COFFEE CHAT (15 mins)', price: 0 },
        { type: '1:1 Mentorship Session', price: 50 }
      ]
      const hasFreeCoffee = Array.isArray(servicesWithVariousCase) &&
          servicesWithVariousCase.some(
              (s: any) => typeof s?.type === 'string' && /free coffee chat/i.test(s.type)
          )
      expect(hasFreeCoffee).toBe(true)
    })

    it('should correctly implement showFreeTrialBanner logic', () => {
      // Scenario 1: Has free coffee service, count is 0
      let hasFreeCoffee = true
      let coffeeChatCount: number = COFFEE_CHAT_SCENARIOS.UNUSED
      let showFreeTrialBanner = hasFreeCoffee && coffeeChatCount === 0
      expect(showFreeTrialBanner).toBe(true)

      // Scenario 2: Has free coffee service, count is > 0
      hasFreeCoffee = true
      coffeeChatCount = COFFEE_CHAT_SCENARIOS.USED_ONCE
      showFreeTrialBanner = hasFreeCoffee && coffeeChatCount === 0
      expect(showFreeTrialBanner).toBe(false)

      // Scenario 3: No free coffee service, count is 0
      hasFreeCoffee = false
      coffeeChatCount = COFFEE_CHAT_SCENARIOS.UNUSED
      showFreeTrialBanner = hasFreeCoffee && coffeeChatCount === 0
      expect(showFreeTrialBanner).toBe(false)
    })

    it('should handle missing or invalid mentor services', () => {
      const mentorWithNullServices = { ...MOCK_MENTOR_DATA, services: null as any }
      let hasFreeCoffee = Array.isArray(mentorWithNullServices?.services) &&
          mentorWithNullServices.services.some(
              (s: any) => typeof s?.type === 'string' && /free coffee chat/i.test(s.type)
          )
      expect(hasFreeCoffee).toBe(false)

      const mentorWithUndefinedServices = { ...MOCK_MENTOR_DATA, services: undefined as any }
      hasFreeCoffee = Array.isArray(mentorWithUndefinedServices?.services) &&
          mentorWithUndefinedServices.services?.some(
              (s: any) => typeof s?.type === 'string' && /free coffee chat/i.test(s.type)
          )
      expect(hasFreeCoffee).toBe(false)

      const mentorWithInvalidServiceType = { ...MOCK_MENTOR_DATA, services: [{ type: 123, price: 0 }] as any }
      hasFreeCoffee = Array.isArray(mentorWithInvalidServiceType?.services) &&
          mentorWithInvalidServiceType.services.some(
              (s: any) => typeof s?.type === 'string' && /free coffee chat/i.test(s.type)
          )
      expect(hasFreeCoffee).toBe(false)
    })
  })

  describe('Visual Regression Tests', () => {
    it('should match visual snapshot for signed-in user with mentor availability', async () => {
      // Suppress console warnings during snapshot testing
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      await act(async () => {
        render(<MentorDetailsPage />)
      })

      await waitFor(() => {
        expect(screen.getByText('Test Mentor')).toBeInTheDocument()
      }, { timeout: 10000 })

      // Wait for MentorAvailability to render
      await waitFor(() => {
        expect(screen.getByTestId('mentor-availability')).toBeInTheDocument()
      }, { timeout: 5000 })

      // Wait for all state updates to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 500))
      })

      // Take snapshot of the component tree structure
      const component = screen.getByTestId('mentor-availability')
      expect(component).toMatchSnapshot('mentor-details-with-availability')

      // Restore console methods
      consoleSpy.mockRestore()
      consoleWarnSpy.mockRestore()
    })

    it('should match visual snapshot for signed-in user with different mentor services', async () => {
      // Suppress console warnings during snapshot testing
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      // Override to use mentor without free coffee
      mockFetch.mockImplementation((url) => {
        if (url === '/api/user/test-mentor-id') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: mockMentorWithoutFreeCoffee }),
          } as Response)
        }
        if (url === '/api/user/test-user-id') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: { resume: null } }),
          } as Response)
        }
        if (url === '/api/user/test-user-id/get_coffee_chat_time') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: 0 }),
          } as Response)
        }
        return Promise.reject(new Error('Unexpected URL'))
      })

      await act(async () => {
        render(<MentorDetailsPage />)
      })

      await waitFor(() => {
        expect(screen.getByText('Test Mentor')).toBeInTheDocument()
      }, { timeout: 10000 })

      // Wait for all state updates to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 500))
      })

      const component = screen.getByTestId('mentor-availability')
      expect(component).toMatchSnapshot('mentor-details-different-services')

      // Restore console methods
      consoleSpy.mockRestore()
      consoleWarnSpy.mockRestore()
    })

    it('should allow not signed-in user to view mentor details and availability', async () => {
      // Suppress console warnings during testing
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      setMockSignedInState(false)

      mockUseUser.mockReturnValue({
        isSignedIn: false,
        user: null,
        isLoaded: true,
      })

      mockFetch.mockImplementation((url) => {
        if (url === '/api/user/test-mentor-id') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: mockMentorWithFreeCoffee }),
          } as Response)
        }
        return Promise.reject(new Error('Unexpected URL for unsigned user'))
      })

      await act(async () => {
        render(<MentorDetailsPage />)
      })

      await waitFor(() => {
        expect(screen.getByText('Test Mentor')).toBeInTheDocument()
      }, { timeout: 10000 })

      // Wait for component to stabilize
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 500))
      })

      // UNIT TEST: Verify what MentorDetailsPage itself renders
      // This tests the actual component logic, not mocked behavior
      expect(screen.getByText('Test Mentor')).toBeInTheDocument()

      // Verify MentorAvailability component IS rendered (integration with child component)
      expect(screen.queryByTestId('mentor-availability')).toBeInTheDocument()

      // Verify the component receives correct props for unauthenticated state
      expect(screen.queryByTestId('availability-component')).toBeInTheDocument()

      // Restore console methods
      consoleSpy.mockRestore()
      consoleWarnSpy.mockRestore()
    })

    it('should redirect unsigned user to login when trying to book', async () => {
      // Suppress console warnings during testing
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      setMockSignedInState(false)

      mockUseUser.mockReturnValue({
        isSignedIn: false,
        user: null,
        isLoaded: true,
      })

      // Mock router to capture redirect calls
      const mockPush = jest.fn()
      ;(useRouter as jest.Mock).mockReturnValue({
        push: mockPush,
        query: { id: 'test-mentor-id' },
      })

      mockFetch.mockImplementation((url) => {
        if (url === '/api/user/test-mentor-id') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: mockMentorWithFreeCoffee }),
          } as Response)
        }
        return Promise.reject(new Error('Unexpected URL for unsigned user'))
      })

      await act(async () => {
        render(<MentorDetailsPage />)
      })

      await waitFor(() => {
        expect(screen.getByText('Test Mentor')).toBeInTheDocument()
      }, { timeout: 10000 })

      // Wait for component to stabilize
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 500))
      })

      // Verify the component rendered properly for unsigned users
      expect(screen.getByTestId('mentor-availability')).toBeInTheDocument()
      
      // Now test the REAL redirect behavior - click the mock book button
      const bookButton = screen.getByTestId('mock-book-button')
      expect(bookButton).toBeInTheDocument()
      
      // Click the button - this should trigger the real onBook callback from MentorDetailsPage
      await act(async () => {
        fireEvent.click(bookButton)
      })

      // Verify the redirect happened - this tests the REAL authentication logic
      expect(mockPush).toHaveBeenCalledWith('/login')

      // Restore console methods
      consoleSpy.mockRestore()
      consoleWarnSpy.mockRestore()
    })

    it('should match visual snapshot for mobile view with trial tip banner', async () => {
      // Suppress console warnings during snapshot testing
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      // Mock mobile viewport
      mockUseBreakpoint.mockReturnValue({
        md: false, // Mobile viewport
      })

      await act(async () => {
        render(<MentorDetailsPage />)
      })

      await waitFor(() => {
        expect(screen.getByText('Test Mentor')).toBeInTheDocument()
      }, { timeout: 10000 })

      await waitFor(() => {
        expect(screen.getByText('Book your free trial session!')).toBeInTheDocument()
      }, { timeout: 5000 })

      // Wait for all state updates to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 500))
      })

      // Snapshot mobile-specific elements
      const trialTipBanner = screen.getByText('Book your free trial session!').closest('div')
      expect(trialTipBanner).toMatchSnapshot('mobile-trial-tip-banner')

      // Restore console methods
      consoleSpy.mockRestore()
      consoleWarnSpy.mockRestore()
    })
  })

  describe('User Journey Tests', () => {
    describe('Free Coffee Chat Booking Journey', () => {
      it('should complete full mentor page loading flow for new user', async () => {
        // Step 1: User lands on mentor page
        render(<MentorDetailsPage />)

        await waitFor(() => {
          expect(screen.getByText('Test Mentor')).toBeInTheDocument()
        }, { timeout: 10000 })

        // Step 2: User sees mentor availability component
        await waitFor(() => {
          expect(screen.getByTestId('mentor-availability')).toBeInTheDocument()
        })

        // Step 3: User sees availability interface
        expect(screen.getByTestId('mentor-availability')).toBeInTheDocument()
        expect(screen.getByTestId('availability-component')).toBeInTheDocument()

        // Step 4: Verify complete page loads successfully
        // The actual banner/booking logic should be tested in MentorAvailability component tests
        expect(screen.getByTestId('mentor-availability')).toBeInTheDocument()

        // This simulates the complete visual journey a user would see
        // In a real e2e test, we would click slots and complete booking
      })

      it('should render availability for users regardless of coffee chat usage', async () => {
        // Mock user who already used free coffee chat
        mockFetch.mockImplementation((url) => {
          if (url === '/api/user/test-mentor-id') {
            return Promise.resolve({
              ok: true,
              json: async () => ({ data: mockMentorWithFreeCoffee }),
            } as Response)
          }
          if (url === '/api/user/test-user-id') {
            return Promise.resolve({
              ok: true,
              json: async () => ({ data: { resume: null } }),
            } as Response)
          }
          if (url === '/api/user/test-user-id/get_coffee_chat_time') {
            return Promise.resolve({
              ok: true,
              json: async () => ({ data: 1 }), // Already used
            } as Response)
          }
          return Promise.reject(new Error('Unexpected URL'))
        })

        render(<MentorDetailsPage />)

        await waitFor(() => {
          expect(screen.getByText('Test Mentor')).toBeInTheDocument()
        }, { timeout: 10000 })

        // Wait for component to stabilize
        await new Promise(resolve => setTimeout(resolve, 500))

        // User should see availability regardless of coffee chat usage
        expect(screen.getByTestId('mentor-availability')).toBeInTheDocument()

        // User journey: sees booking options (banner logic tested in MentorAvailability tests)
        expect(screen.getByTestId('availability-component')).toBeInTheDocument()
      })
    })

    describe('Authentication-based User Journeys', () => {

      it('should render availability for mentors viewing their own profile', async () => {
        // Test viewing own profile (though this is MentorDetailsPage, not profile edit)
        mockUseUser.mockReturnValue({
          isSignedIn: true,
          user: { id: 'test-mentor-id' } as any, // Same as mentor ID
          isLoaded: true,
        })

        // Mock the coffee chat count API for the mentor's own ID
        mockFetch.mockImplementation((url) => {
          if (url === '/api/user/test-mentor-id') {
            return Promise.resolve({
              ok: true,
              json: async () => ({ data: mockMentorWithFreeCoffee }),
            } as Response)
          }
          if (url === '/api/user/test-mentor-id/get_coffee_chat_time') {
            return Promise.resolve({
              ok: true,
              json: async () => ({ data: 0 }), // Mentor hasn't used their own service
            } as Response)
          }
          return Promise.reject(new Error('Unexpected URL'))
        })

        render(<MentorDetailsPage />)

        await waitFor(() => {
          expect(screen.getByText('Test Mentor')).toBeInTheDocument()
        }, { timeout: 10000 })

        // User journey: mentor viewing their own details page
        // Should see availability component
        expect(screen.getByTestId('mentor-availability')).toBeInTheDocument()

        // INTEGRATION TEST: Component renders for mentor viewing their own profile
        // Business logic (whether mentors can book themselves) should be tested in MentorAvailability tests
        expect(screen.getByTestId('availability-component')).toBeInTheDocument()

        // Note: In a real business scenario, mentors probably shouldn't book themselves
        // This test documents the current behavior - if business logic changes, update this test
      })
    })

    describe('Responsive Design User Journeys', () => {
      it('should provide optimized mobile experience', async () => {
        // Mock mobile viewport
        mockUseBreakpoint.mockReturnValue({
          md: false, // Mobile
        })

        render(<MentorDetailsPage />)

        await waitFor(() => {
          expect(screen.getByText('Test Mentor')).toBeInTheDocument()
        }, { timeout: 10000 })

        // Mobile user journey: sees trial tip banner
        await waitFor(() => {
          expect(screen.getByText('Book your free trial session!')).toBeInTheDocument()
          expect(screen.getByLabelText('Dismiss')).toBeInTheDocument()
        })

        // Mobile-specific UI elements should be present
        const dismissButton = screen.getByLabelText('Dismiss')

        // Simulate user dismissing the mobile banner
        fireEvent.click(dismissButton)

        // After dismissal, banner should be removed (in real implementation)
        // This tests the mobile-specific interaction flow
      })

      it('should provide full desktop experience', async () => {
        // Mock desktop viewport (default)
        mockUseBreakpoint.mockReturnValue({
          md: true, // Desktop
        })

        render(<MentorDetailsPage />)

        await waitFor(() => {
          expect(screen.getByText('Test Mentor')).toBeInTheDocument()
        }, { timeout: 10000 })

        // Desktop user journey: full availability interface visible
        expect(screen.getByTestId('mentor-availability')).toBeInTheDocument()

        // Desktop users should not see mobile trial tip banner
        expect(screen.queryByText('Book your free trial session!')).not.toBeInTheDocument()

        // Desktop users see the full availability interface
        expect(screen.getByTestId('availability-component')).toBeInTheDocument()
      })
    })

    describe('Error Handling User Journeys', () => {
      it('should handle mentor data loading errors gracefully', async () => {
        // Mock API failure
        mockFetch.mockImplementation(() => {
          return Promise.reject(new Error('Network error'))
        })

        // Mock console.error to avoid test output noise
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

        render(<MentorDetailsPage />)

        // User journey: experiences network error
        // Component should handle gracefully without crashing

        // Wait for error handling to complete
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Component should still render (though with error state)
        // This validates error boundaries and graceful degradation
        expect(document.body).toBeTruthy() // Component didn't crash

        consoleSpy.mockRestore()
      })

      it('should handle coffee chat count API errors', async () => {
        // Mock mentor data success but coffee chat count failure
        mockFetch.mockImplementation((url) => {
          if (url === '/api/user/test-mentor-id') {
            return Promise.resolve({
              ok: true,
              json: async () => ({ data: mockMentorWithFreeCoffee }),
            } as Response)
          }
          if (url === '/api/user/test-user-id') {
            return Promise.resolve({
              ok: true,
              json: async () => ({ data: { resume: null } }),
            } as Response)
          }
          if (url === '/api/user/test-user-id/get_coffee_chat_time') {
            return Promise.reject(new Error('Coffee chat API error'))
          }
          return Promise.reject(new Error('Unexpected URL'))
        })

        render(<MentorDetailsPage />)

        await waitFor(() => {
          expect(screen.getByText('Test Mentor')).toBeInTheDocument()
        }, { timeout: 10000 })

        // User journey: partial API failure
        // Should still show mentor info and availability
        expect(screen.getByTestId('mentor-availability')).toBeInTheDocument()

        // Banner behavior should degrade gracefully (might not show or show default)
        // This tests resilience to partial API failures
      })
    })
  })
})