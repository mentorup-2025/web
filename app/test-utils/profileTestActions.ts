/**
 * Profile Test Actions
 * 
 * Common test actions that are pure DOM interaction utilities.
 * No business logic - just reusable action patterns.
 */

import { screen, waitFor, fireEvent, act } from '@testing-library/react'
import { WAIT_OPTIONS, AVATAR_SELECTORS, TEST_IDS } from './profileTestSetup'

/**
 * Wait for component to be fully loaded (navbar appears)
 */
export async function waitForComponentLoad() {
  await waitFor(() => {
    expect(screen.getByTestId(TEST_IDS.NAVBAR)).toBeInTheDocument()
  }, { timeout: WAIT_OPTIONS.DEFAULT_TIMEOUT })
}

/**
 * Wait for avatar with specific cursor style to appear
 */
export async function waitForAvatarWithCursor(isClickable: boolean) {
  const selector = isClickable ? AVATAR_SELECTORS.CLICKABLE : AVATAR_SELECTORS.NOT_CLICKABLE
  
  await waitFor(() => {
    const avatarContainer = document.querySelector(selector)
    expect(avatarContainer).toBeInTheDocument()
  }, { timeout: WAIT_OPTIONS.DEFAULT_TIMEOUT })
}

/**
 * Click on avatar element
 */
export async function clickAvatar() {
  await act(async () => {
    await waitFor(() => {
      const avatarContainer = document.querySelector('.ant-avatar')
      fireEvent.click(avatarContainer!)
    }, { timeout: WAIT_OPTIONS.DEFAULT_TIMEOUT })
  })
}

/**
 * Check if upload modal is visible
 */
export function expectUploadModalVisible(shouldBeVisible: boolean) {
  const modalQuery = screen.queryByText('Update Profile Image')
  
  if (shouldBeVisible) {
    expect(modalQuery).toBeInTheDocument()
  } else {
    expect(modalQuery).not.toBeInTheDocument()
  }
}

/**
 * Wait for upload modal to appear after action
 */
export async function waitForUploadModal() {
  await waitFor(() => {
    expect(screen.getByText('Update Profile Image')).toBeInTheDocument()
  }, { timeout: WAIT_OPTIONS.DEFAULT_TIMEOUT })
}

/**
 * Wait a bit to ensure modal doesn't appear (for negative tests)
 */
export async function waitForModalNotToAppear() {
  await new Promise(resolve => setTimeout(resolve, 500))
}

/**
 * Wait for free coffee chat banner to appear
 */
export async function waitForFreeCoffeeBanner() {
  await waitFor(() => {
    expect(screen.getByText('📣 Your first 15-min coffee chat is on us!')).toBeInTheDocument()
  }, { timeout: WAIT_OPTIONS.DEFAULT_TIMEOUT })
}

/**
 * Check if free coffee chat banner is visible
 */
export function expectFreeCoffeeBannerVisible(shouldBeVisible: boolean) {
  const bannerQuery = screen.queryByText('📣 Your first 15-min coffee chat is on us!')
  
  if (shouldBeVisible) {
    expect(bannerQuery).toBeInTheDocument()
  } else {
    expect(bannerQuery).not.toBeInTheDocument()
  }
}
