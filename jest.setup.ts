import '@testing-library/jest-dom'

// Mock window.matchMedia for Ant Design
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock ResizeObserver for Ant Design
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock Next.js router - will be overridden in individual test files
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
    id: 'test-user-id',
  }),
  usePathname: () => '/profile/test-user-id',
}))

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
  useAuth: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    hash: '',
    search: '',
    pathname: '/mentor-profile/test-mentor-id',
  },
  writable: true,
})

// Mock history
Object.defineProperty(window, 'history', {
  value: {
    replaceState: jest.fn(),
  },
  writable: true,
})
