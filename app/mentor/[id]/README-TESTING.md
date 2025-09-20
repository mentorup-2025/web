# MentorDetailsPage Testing Guide

This directory contains comprehensive tests for the MentorDetailsPage component, including Visual Regression Tests and User Journey Tests.

## Test Structure

### 1. **Business Logic Tests** (Original)
- Free coffee chat banner logic validation
- Service detection and matching
- Authentication state handling
- Edge cases (null/undefined data)

### 2. **Visual Regression Tests** (New)
- Snapshot testing to catch UI changes
- Tests multiple visual states:
  - Signed-in user with free coffee chat available
  - Signed-in user without free coffee chat
  - Not signed-in user experience
  - Mobile view with trial tip banner

### 3. **User Journey Tests** (New)
- End-to-end user experience validation
- Tests complete user flows:
  - **Free Coffee Chat Booking Journey**: New user sees banner → availability → booking flow
  - **Authentication-based Journeys**: Different experiences for signed-in vs signed-out users
  - **Responsive Design Journeys**: Mobile vs desktop experiences
  - **Error Handling Journeys**: Graceful degradation when APIs fail

## Running Tests

```bash
# Run all tests
npm test MentorDetailsPage.test.tsx

# Run only business logic tests
npm test -- --testNamePattern="free coffee chat detection logic"

# Run only visual regression tests
npm test -- --testNamePattern="Visual Regression Tests"

# Run only user journey tests
npm test -- --testNamePattern="User Journey Tests"

# Update snapshots (when UI intentionally changes)
npm test -- --updateSnapshot MentorDetailsPage.test.tsx
```

## Visual Regression Testing

### How It Works
- Tests take "snapshots" of component DOM structure
- Future test runs compare against stored snapshots
- Fails if structure changes unexpectedly
- Snapshots stored in `__snapshots__/` directory

### When Snapshots Fail
1. **Intentional UI change**: Run `npm test -- --updateSnapshot` to update snapshots
2. **Unintentional change**: Fix the code to match expected UI
3. **New test**: First run creates baseline snapshot

### Snapshot Files Created
- `mentor-details-with-free-coffee-banner.snap`
- `mentor-details-without-free-coffee-banner.snap`
- `mentor-details-not-signed-in.snap`
- `mobile-trial-tip-banner.snap`

## User Journey Testing

### Purpose
- Validates complete user workflows
- Tests user experience from start to finish
- Ensures different user types get appropriate experiences

### Key Journeys Tested

#### 1. Free Coffee Chat Journey
```
User lands on page → Sees banner → Views availability → Ready to book
```

#### 2. Authentication Journeys
```
Signed-in user: Full experience with booking
Signed-out user: Limited view, encouraged to sign in
Mentor viewing own page: No self-booking
```

#### 3. Responsive Journeys
```
Mobile: Trial tip banner + compact UI
Desktop: Full interface + in-component banner
```

#### 4. Error Handling Journeys
```
API failure → Graceful degradation → User can still view basic info
```

## Mock Strategy

### Component Mocks
- `MentorAvailability`: Mocked to focus on banner logic
- `Navbar`, `ChatWidget`: Mocked as simple divs
- `MentorReviews`: Mocked for isolation

### API Mocks
- `/api/user/{id}`: Mentor data
- `/api/user/{id}/get_coffee_chat_time`: Coffee chat usage count
- Configurable per test for different scenarios

### Authentication Mocks
- `SignedIn`/`SignedOut`: Respect mock sign-in state
- `useUser`/`useAuth`: Configurable user data
- Global state management for consistent behavior

## Bug Detection Capabilities

### ✅ Will Catch
- **Business logic bugs**: Banner showing/hiding incorrectly
- **UI structure changes**: Components added/removed/reordered
- **Authentication bugs**: Wrong content for user states
- **Responsive bugs**: Mobile/desktop behavior changes
- **API integration bugs**: Wrong data handling
- **Error handling bugs**: Component crashes on failures

### ⚠️ Might Miss
- **Visual styling bugs**: Colors, fonts, spacing (use visual diff tools)
- **Performance issues**: Slow renders, memory leaks
- **Real API changes**: Mock might not match production
- **Complex interactions**: Multi-step booking flows (needs E2E)

## Maintenance

### When to Update Tests
1. **Business logic changes**: Update logic validation tests
2. **UI structure changes**: Update snapshots
3. **New user journeys**: Add new journey tests
4. **API changes**: Update mock responses

### Test Health Indicators
- **High pass rate**: Business logic is stable
- **Snapshot stability**: UI is consistent
- **Journey completeness**: All user paths tested
- **Error coverage**: Edge cases handled

## Integration with CI/CD

These tests are designed to run in GitHub Actions:
- Fast execution (under 30 seconds)
- Deterministic results
- Clear failure messages
- Snapshot management support

Add to your CI pipeline:
```yaml
- name: Run MentorDetailsPage tests
  run: npm test -- MentorDetailsPage.test.tsx --coverage
```
