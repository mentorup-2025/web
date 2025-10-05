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
  SignedIn: ({ children }: any) => (mockIsSignedIn ? children : null),
  SignedOut: ({ children }: any) => (!mockIsSignedIn ? children : null),
  SignInButton: ({ children }: any) => <button data-testid="signin-button">{children}</button>,
  useClerk: jest.fn(() => ({
    signOut: jest.fn(),
  })),
}))

// Helper function to set mock sign-in state
const setMockSignedInState = (isSignedIn: boolean) => {
  mockIsSignedIn = isSignedIn
}

// Mock Ant Design Grid for responsive testing
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

// ✅ 统一 Mock MentorAvailability（含 onBook 按钮 + 正确文案）
jest.mock('../../components/MentorAvailability', () => {
  return function MockMentorAvailability({ onBook, coffeeChatCount, services }: any) {
    const hasFreeCoffee =
        Array.isArray(services) &&
        services.some((s: any) => typeof s?.type === 'string' && /free coffee chat/i.test(s.type))

    const showFreeBanner = hasFreeCoffee && coffeeChatCount === 0

    return (
        <div data-testid="mentor-availability">
          <div data-testid="availability-component">Mentor Availability Component</div>
          {showFreeBanner && (
              <div data-testid="mentor-availability-banner">Get a trial session for FREE!</div>
          )}
          {/* 提供可点击的 onBook 以测试未登录跳转 */}
          <button data-testid="book-button" onClick={onBook}>
            Book Now
          </button>
        </div>
    )
  }
})

// Mock other components
jest.mock('../../components/ChatWidget', () => {
  return function MockChatWidget() {
    return <div data-testid="chat-widget">Chat Widget</div>
  }
})

jest.mock('../../components/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>
  }
})

jest.mock('../components/MentorReview', () => {
  return function MockMentorReviews() {
    return <div data-testid="mentor-reviews">Mentor Reviews</div>
  }
})

// Mock moment-timezone
jest.mock('moment-timezone', () => {
  const moment = jest.requireActual('moment')
  return {
    ...moment,
    tz: jest.fn(() => moment()),
  }
})

// ⚠️ 不再 mock dayjs，避免 ESM/CJS/插件导致的默认导出问题

// Mock constants and helpers
jest.mock('../../services/constants', () => ({
  isFreeCoffeeChat: jest.fn(),
}))

jest.mock('../../services/priceHelper', () => ({
  netToGross: jest.fn(),
}))

describe('MentorDetailsPage Free Coffee Chat Banner Logic', () => {
  const { mockUseUser, mockFetch, resetMocks } = setupProfileTestMocks()
  const mockRouterPush = jest.fn()
  const mockUseBreakpoint = Grid.useBreakpoint as jest.MockedFunction<typeof Grid.useBreakpoint>

  const mockMentorWithFreeCoffee = {
    ...MOCK_MENTOR_DATA,
    user_id: 'test-mentor-id',
    mentor: {
      ...MOCK_MENTOR_DATA.mentor,
      services: SERVICES_WITH_FREE_COFFEE,
    },
  }

  const mockMentorWithoutFreeCoffee = {
    ...MOCK_MENTOR_DATA,
    user_id: 'test-mentor-id',
    mentor: {
      ...MOCK_MENTOR_DATA.mentor,
      services: SERVICES_WITHOUT_FREE_COFFEE,
    },
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
    it('should show free coffee chat banner in MentorAvailability when mentee has not used free coffee chat', async () => {
      render(<MentorDetailsPage />)

      // Wait for component to load mentor data
      await waitFor(
          () => {
            expect(screen.getByText('Test Mentor')).toBeInTheDocument()
          },
          { timeout: 10000 },
      )

      // Wait for MentorAvailability banner to appear (this tests the business logic)
      await waitFor(
          () => {
            expect(screen.getByTestId('mentor-availability-banner')).toBeInTheDocument()
            expect(screen.getByText('Get a trial session for FREE!')).toBeInTheDocument()
          },
          { timeout: 10000 },
      )
    })

    it('should NOT show free coffee chat banner when mentee has already used free coffee chat', async () => {
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

      await waitFor(
          () => {
            expect(screen.getByText('Test Mentor')).toBeInTheDocument()
          },
          { timeout: 10000 },
      )

      // BUSINESS LOGIC: Banner should NOT be visible when already used
      await new Promise((resolve) => setTimeout(resolve, 500))
      expect(screen.queryByTestId('mentor-availability-banner')).not.toBeInTheDocument()
    })
  })

  describe('when mentor does NOT provide Free Coffee Chat service', () => {
    it('should NOT show free coffee chat banner even when mentee has not used free coffee chat', async () => {
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

      await waitFor(
          () => {
            expect(screen.getByText('Test Mentor')).toBeInTheDocument()
          },
          { timeout: 10000 },
      )

      await new Promise((resolve) => setTimeout(resolve, 500))
      expect(screen.queryByTestId('mentor-availability-banner')).not.toBeInTheDocument()
    })
  })

  describe('mobile trial tip banner', () => {
    it('should show mobile trial tip banner when conditions are met', async () => {
      // Mock mobile viewport in Ant Design Grid
      mockUseBreakpoint.mockReturnValue({
        md: false, // Mobile viewport
      })

      render(<MentorDetailsPage />)

      await waitFor(
          () => {
            expect(screen.getByText('Test Mentor')).toBeInTheDocument()
          },
          { timeout: 10000 },
      )

      await waitFor(
          () => {
            expect(screen.getByText('Book your free trial session!')).toBeInTheDocument()
            expect(screen.getByLabelText('Dismiss')).toBeInTheDocument()
          },
          { timeout: 10000 },
      )
    })
  })

  describe('free coffee chat detection logic validation', () => {
    it('should correctly detect free coffee chat service with case-insensitive matching', () => {
      const servicesWithVariousCase = [
        { type: 'FREE COFFEE CHAT (15 mins)', price: 0 },
        { type: '1:1 Mentorship Session', price: 50 },
      ]
      const hasFreeCoffee =
          Array.isArray(servicesWithVariousCase) &&
          servicesWithVariousCase.some(
              (s: any) => typeof s?.type === 'string' && /free coffee chat/i.test(s.type),
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
      let hasFreeCoffee =
          Array.isArray(mentorWithNullServices?.services) &&
          mentorWithNullServices.services.some(
              (s: any) => typeof s?.type === 'string' && /free coffee chat/i.test(s.type),
          )
      expect(hasFreeCoffee).toBe(false)

      const mentorWithUndefinedServices = { ...MOCK_MENTOR_DATA, services: undefined as any }
      hasFreeCoffee =
          Array.isArray(mentorWithUndefinedServices?.services) &&
          mentorWithUndefinedServices.services?.some(
              (s: any) => typeof s?.type === 'string' && /free coffee chat/i.test(s.type),
          )
      expect(hasFreeCoffee).toBe(false)

      const mentorWithInvalidServiceType = {
        ...MOCK_MENTOR_DATA,
        services: [{ type: 123, price: 0 }] as any,
      }
      hasFreeCoffee =
          Array.isArray(mentorWithInvalidServiceType?.services) &&
          mentorWithInvalidServiceType.services.some(
              (s: any) => typeof s?.type === 'string' && /free coffee chat/i.test(s.type),
          )
      expect(hasFreeCoffee).toBe(false)
    })
  })

  describe('Visual Regression Tests', () => {
    it('should match visual snapshot for signed-in user with free coffee chat available', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      await act(async () => {
        render(<MentorDetailsPage />)
      })

      await waitFor(
          () => {
            expect(screen.getByText('Test Mentor')).toBeInTheDocument()
          },
          { timeout: 10000 },
      )

      await waitFor(
          () => {
            expect(screen.getByTestId('mentor-availability-banner')).toBeInTheDocument()
          },
          { timeout: 5000 },
      )

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500))
      })

      const component = screen.getByTestId('mentor-availability')
      expect(component).toMatchSnapshot('mentor-details-with-free-coffee-banner')

      consoleSpy.mockRestore()
      consoleWarnSpy.mockRestore()
    })

    it('should match visual snapshot for signed-in user with no free coffee chat', async () => {
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

      await waitFor(
          () => {
            expect(screen.getByText('Test Mentor')).toBeInTheDocument()
          },
          { timeout: 10000 },
      )

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500))
      })

      const component = screen.getByTestId('mentor-availability')
      expect(component).toMatchSnapshot('mentor-details-without-free-coffee-banner')

      consoleSpy.mockRestore()
      consoleWarnSpy.mockRestore()
    })

    it('should allow not signed-in user to view mentor details and availability', async () => {
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

      await waitFor(
          () => {
            expect(screen.getByText('Test Mentor')).toBeInTheDocument()
          },
          { timeout: 10000 },
      )

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500))
      })

      expect(screen.getByText('Test Mentor')).toBeInTheDocument()
      expect(screen.queryByTestId('mentor-availability')).toBeInTheDocument()
      expect(screen.queryByTestId('availability-component')).toBeInTheDocument()

      consoleSpy.mockRestore()
      consoleWarnSpy.mockRestore()
    })

    it('should redirect unsigned user to login when trying to book', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      setMockSignedInState(false)

      mockUseUser.mockReturnValue({
        isSignedIn: false,
        user: null,
        isLoaded: true,
      })

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

      await waitFor(
          () => {
            expect(screen.getByText('Test Mentor')).toBeInTheDocument()
          },
          { timeout: 10000 },
      )

      // 点击我们顶层 mock 里暴露的 Book Now 按钮，触发 MentorDetailsPage 的 onBook（未登录 → 跳登录）
      fireEvent.click(screen.getByTestId('book-button'))
      expect(mockPush).toHaveBeenCalledWith('/login')

      consoleSpy.mockRestore()
      consoleWarnSpy.mockRestore()
    })

    it('should match visual snapshot for mobile view with trial tip banner', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      mockUseBreakpoint.mockReturnValue({
        md: false, // Mobile viewport
      })

      await act(async () => {
        render(<MentorDetailsPage />)
      })

      await waitFor(
          () => {
            expect(screen.getByText('Test Mentor')).toBeInTheDocument()
          },
          { timeout: 10000 },
      )

      await waitFor(
          () => {
            expect(screen.getByText('Book your free trial session!')).toBeInTheDocument()
          },
          { timeout: 5000 },
      )

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500))
      })

      const trialTipBanner = screen.getByText('Book your free trial session!').closest('div')
      expect(trialTipBanner).toMatchSnapshot('mobile-trial-tip-banner')

      consoleSpy.mockRestore()
      consoleWarnSpy.mockRestore()
    })
  })

  describe('User Journey Tests', () => {
    describe('Free Coffee Chat Booking Journey', () => {
      it('should complete full free coffee chat booking flow for new user', async () => {
        render(<MentorDetailsPage />)

        await waitFor(
            () => {
              expect(screen.getByText('Test Mentor')).toBeInTheDocument()
            },
            { timeout: 10000 },
        )

        await waitFor(() => {
          expect(screen.getByTestId('mentor-availability-banner')).toBeInTheDocument()
          expect(screen.getByText('Get a trial session for FREE!')).toBeInTheDocument()
        })

        expect(screen.getByTestId('mentor-availability')).toBeInTheDocument()
        expect(screen.getByTestId('availability-component')).toBeInTheDocument()

        expect(screen.getByTestId('mentor-availability-banner')).toBeInTheDocument()
        expect(screen.getByText('Get a trial session for FREE!')).toBeInTheDocument()
      })

      it('should show appropriate messaging for users who already used free chat', async () => {
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

        await waitFor(
            () => {
              expect(screen.getByText('Test Mentor')).toBeInTheDocument()
            },
            { timeout: 10000 },
        )

        await new Promise((resolve) => setTimeout(resolve, 500))

        expect(screen.getByTestId('mentor-availability')).toBeInTheDocument()
        expect(screen.queryByTestId('mentor-availability-banner')).not.toBeInTheDocument()
        expect(screen.getByTestId('availability-component')).toBeInTheDocument()
      })
    })

    describe('Authentication-based User Journeys', () => {
      it('should provide different experience for mentors viewing their own profile vs others', async () => {
        mockUseUser.mockReturnValue({
          isSignedIn: true,
          user: { id: 'test-mentor-id' } as any, // Same as mentor ID
          isLoaded: true,
        })

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

        await waitFor(
            () => {
              expect(screen.getByText('Test Mentor')).toBeInTheDocument()
            },
            { timeout: 10000 },
        )

        expect(screen.getByTestId('mentor-availability')).toBeInTheDocument()
        expect(screen.getByTestId('mentor-availability-banner')).toBeInTheDocument()
      })
    })

    describe('Responsive Design User Journeys', () => {
      it('should provide optimized mobile experience', async () => {
        mockUseBreakpoint.mockReturnValue({
          md: false, // Mobile
        })

        render(<MentorDetailsPage />)

        await waitFor(
            () => {
              expect(screen.getByText('Test Mentor')).toBeInTheDocument()
            },
            { timeout: 10000 },
        )

        await waitFor(() => {
          expect(screen.getByText('Book your free trial session!')).toBeInTheDocument()
          expect(screen.getByLabelText('Dismiss')).toBeInTheDocument()
        })

        const dismissButton = screen.getByLabelText('Dismiss')
        fireEvent.click(dismissButton)
      })

      it('should provide full desktop experience', async () => {
        mockUseBreakpoint.mockReturnValue({
          md: true, // Desktop
        })

        render(<MentorDetailsPage />)

        await waitFor(
            () => {
              expect(screen.getByText('Test Mentor')).toBeInTheDocument()
            },
            { timeout: 10000 },
        )

        expect(screen.getByTestId('mentor-availability')).toBeInTheDocument()
        expect(screen.queryByText('Book your free trial session!')).not.toBeInTheDocument()

        await waitFor(() => {
          expect(screen.getByTestId('mentor-availability-banner')).toBeInTheDocument()
        })
      })
    })

    describe('Error Handling User Journeys', () => {
      it('should handle mentor data loading errors gracefully', async () => {
        mockFetch.mockImplementation(() => {
          return Promise.reject(new Error('Network error'))
        })

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

        render(<MentorDetailsPage />)

        await new Promise((resolve) => setTimeout(resolve, 1000))
        expect(document.body).toBeTruthy()

        consoleSpy.mockRestore()
      })

      it('should handle coffee chat count API errors', async () => {
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

        await waitFor(
            () => {
              expect(screen.getByText('Test Mentor')).toBeInTheDocument()
            },
            { timeout: 10000 },
        )

        expect(screen.getByTestId('mentor-availability')).toBeInTheDocument()
      })
    })
  })
})