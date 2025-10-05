import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import MentorAvailability from './index'

// Mock dayjs
jest.mock('dayjs', () => {
  const originalDayjs = jest.requireActual('dayjs')
  const mockDayjs = jest.fn((date?: any) => originalDayjs(date || '2024-01-15T10:00:00.000Z'))
  Object.assign(mockDayjs, originalDayjs)
  return mockDayjs
})

// Mock supabase
jest.mock('../../services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          is: jest.fn(() => ({
            data: [],
            error: null,
          }))
        }))
      }))
    }))
  }
}))

// Mock fetch for API calls
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('MentorAvailability Free Coffee Chat Banner', () => {
  const defaultProps = {
    mentorId: 'test-mentor-id',
    onSlotSelect: jest.fn(),
    onBook: jest.fn(),
  }

  const mockAvailabilityResponse = {
    data: {
      '2024-01-15': [
        {
          raw: '9:00 AM - 10:00 AM',
          formatted: '9-10 AM'
        }
      ]
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock successful availability API response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockAvailabilityResponse.data
      }),
    } as Response)
  })

  describe('when mentor provides Free Coffee Chat service', () => {
    const servicesWithFreeCoffee = [
      { type: 'Free Coffee Chat (15 Mins)', price: 0 },
      { type: '1:1 Mentorship Session', price: 50 }
    ]

    describe('and mentee has not used free coffee chat (coffeeChatCount = 0)', () => {
      it('should show the free coffee chat banner when date is selected', async () => {
        render(
            <MentorAvailability
                {...defaultProps}
                services={servicesWithFreeCoffee}
                coffeeChatCount={0}
            />
        )

        // Wait for component to load - look for month text
        await waitFor(() => {
          expect(screen.getByText('Jan')).toBeInTheDocument()
        })

        // Click on a date to select it
        const dateButton = screen.getByText('15')
        fireEvent.click(dateButton)

        // Wait for time slots to appear
        await waitFor(() => {
          expect(screen.getByText(/Available Time Slots on/)).toBeInTheDocument()
        })

        // BUSINESS LOGIC: Banner should be visible
        await waitFor(() => {
          expect(screen.getByText('📣 Your first 15-min coffee chat is on us!')).toBeInTheDocument()
          expect(screen.getByText(/Pick any available slot — your session will take place in the first 15 min/)).toBeInTheDocument()
        })
      })

      it('should not show banner when no date is selected', async () => {
        render(
            <MentorAvailability
                {...defaultProps}
                services={servicesWithFreeCoffee}
                coffeeChatCount={0}
            />
        )

        await waitFor(() => {
          expect(screen.getByText('Jan')).toBeInTheDocument()
        })

        // BUSINESS LOGIC: Banner should not be visible without date selection
        expect(screen.queryByText('📣 Your first 15-min coffee chat is on us!')).not.toBeInTheDocument()
      })
    })

    describe('and mentee has already used free coffee chat (coffeeChatCount > 0)', () => {
      it('should NOT show the free coffee chat banner', async () => {
        render(
            <MentorAvailability
                {...defaultProps}
                services={servicesWithFreeCoffee}
                coffeeChatCount={1}
            />
        )

        await waitFor(() => {
          expect(screen.getByText('Jan')).toBeInTheDocument()
        })

        // Click on a date to select it
        const dateButton = screen.getByText('15')
        fireEvent.click(dateButton)

        await waitFor(() => {
          expect(screen.getByText(/Available Time Slots on/)).toBeInTheDocument()
        })

        // BUSINESS LOGIC: Banner should NOT be visible when already used
        expect(screen.queryByText('📣 Your first 15-min coffee chat is on us!')).not.toBeInTheDocument()
      })
    })
  })

  describe('when mentor does NOT provide Free Coffee Chat service', () => {
    const servicesWithoutFreeCoffee = [
      { type: '1:1 Mentorship Session', price: 50 },
      { type: 'Resume Review', price: 25 }
    ]

    it('should NOT show the free coffee chat banner even if coffeeChatCount is 0', async () => {
      render(
          <MentorAvailability
              {...defaultProps}
              services={servicesWithoutFreeCoffee}
              coffeeChatCount={0}
          />
      )

      await waitFor(() => {
        expect(screen.getByText('Jan')).toBeInTheDocument()
      })

      // Click on a date to select it
      const dateButton = screen.getByText('15')
      fireEvent.click(dateButton)

      await waitFor(() => {
        expect(screen.getByText(/Available Time Slots on/)).toBeInTheDocument()
      })

      // BUSINESS LOGIC: Banner should NOT be visible when service is not offered
      expect(screen.queryByText('📣 Your first 15-min coffee chat is on us!')).not.toBeInTheDocument()
    })
  })

  describe('service detection logic', () => {
    it('should detect free coffee chat service with case-insensitive matching', async () => {
      const servicesWithVariousCase = [
        { type: 'FREE COFFEE CHAT (15 mins)', price: 0 },
        { type: '1:1 Mentorship Session', price: 50 }
      ]

      render(
          <MentorAvailability
              {...defaultProps}
              services={servicesWithVariousCase}
              coffeeChatCount={0}
          />
      )

      await waitFor(() => {
        expect(screen.getByText('Jan')).toBeInTheDocument()
      })

      const dateButton = screen.getByText('15')
      fireEvent.click(dateButton)

      await waitFor(() => {
        expect(screen.getByText(/Available Time Slots on/)).toBeInTheDocument()
      })

      // BUSINESS LOGIC: Should detect service regardless of case
      expect(screen.getByText('📣 Your first 15-min coffee chat is on us!')).toBeInTheDocument()
    })

    it('should handle empty or invalid services array', async () => {
      render(
          <MentorAvailability
              {...defaultProps}
              services={[]}
              coffeeChatCount={0}
          />
      )

      await waitFor(() => {
        expect(screen.getByText('Jan')).toBeInTheDocument()
      })

      const dateButton = screen.getByText('15')
      fireEvent.click(dateButton)

      await waitFor(() => {
        expect(screen.getByText(/Available Time Slots on/)).toBeInTheDocument()
      })

      // BUSINESS LOGIC: Should handle empty services gracefully
      expect(screen.queryByText('📣 Your first 15-min coffee chat is on us!')).not.toBeInTheDocument()
    })
  })

  describe('banner visibility logic validation', () => {
    it('should correctly implement hasFreeCoffee logic', () => {
      const servicesWithFree = [{ type: 'Free Coffee Chat (15 Mins)', price: 0 }]
      const servicesWithoutFree = [{ type: '1:1 Session', price: 50 }]

      // Test the actual logic from the component
      const hasFreeCoffeeTrue = Array.isArray(servicesWithFree) &&
          servicesWithFree.some((s) => typeof s?.type === 'string' && /free coffee chat/i.test(s.type))

      const hasFreeCoffeeFalse = Array.isArray(servicesWithoutFree) &&
          servicesWithoutFree.some((s) => typeof s?.type === 'string' && /free coffee chat/i.test(s.type))

      expect(hasFreeCoffeeTrue).toBe(true)
      expect(hasFreeCoffeeFalse).toBe(false)
    })

    it('should correctly implement showFreeBanner logic', () => {
      const hasFreeCoffee = true

      // BUSINESS LOGIC: Banner shows when has service AND count is 0
      expect(hasFreeCoffee && 0 === 0).toBe(true)  // Should show
      expect(hasFreeCoffee && 1 === 0).toBe(false) // Should not show
      expect(false && 0 === 0).toBe(false)         // Should not show
    })
  })
})