import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MentorSignup from './MentorSignup'
import { useRouter } from 'next/navigation'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('MentorSignup Avatar Upload Requirement', () => {
  const mockPush = jest.fn()
  const defaultUserId = 'test-user-123'

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  it('should display red asterisk (*) next to avatar upload label', () => {
    render(<MentorSignup userId={defaultUserId} />)
    
    // Find the avatar form item label
    const avatarLabel = screen.getByText('Please upload your profile picture?')
    
    // Check if the form item has the required class or contains asterisk
    const formItem = avatarLabel.closest('.ant-form-item')
    expect(formItem).toBeInTheDocument()
    
    // Look for the asterisk - it might be in the label itself or as a separate element
    const labelContainer = avatarLabel.closest('.ant-form-item-label')
    const hasAsterisk = labelContainer?.querySelector('.ant-form-item-required-mark') || 
                       labelContainer?.textContent?.includes('*') ||
                       formItem?.querySelector('[class*="required"]')
    
    expect(hasAsterisk).toBeTruthy()
  })

  it('should prevent proceeding to next step without uploading avatar', async () => {
    const user = userEvent.setup()
    render(<MentorSignup userId={defaultUserId} />)
    
    // Wait for component to fully load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter your display name')).toBeInTheDocument()
    }, { timeout: 10000 })
    
    // Fill in other required fields
    await user.type(screen.getByPlaceholderText('Enter your display name'), 'Test Mentor')
    
    // Handle Ant Design Select component
    const selectElement = screen.getByRole('combobox')
    await user.click(selectElement)
    
    // Wait for dropdown options to appear and select one
    await waitFor(() => {
      expect(screen.getByText('Senior')).toBeInTheDocument()
    }, { timeout: 10000 })
    await user.click(screen.getByText('Senior'))
    
    await user.type(screen.getByPlaceholderText('Enter your WeChat ID'), 'testuser123')
    
    // Try to go to next step without uploading avatar
    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText('Please upload your profile picture!')).toBeInTheDocument()
    }, { timeout: 10000 })
    
    // Should still be on step 0 (Current Status) - check step indicator
    expect(screen.getByText('Current Status')).toBeInTheDocument()
    
    // Verify we're still on the first step by checking the active step
    const activeStep = document.querySelector('.ant-steps-item-active')
    expect(activeStep).toBeInTheDocument()
    expect(activeStep?.querySelector('.ant-steps-item-title')?.textContent).toBe('Current Status')
  }, 15000)
})
