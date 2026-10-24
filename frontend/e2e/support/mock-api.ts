import type { Page, Route } from '@playwright/test'
import { foodEvent, jazzEvent, rockEvent } from '../../src/test/fixtures/events'
import { handleMockRequest, type MockState } from '../../src/mocks/mock-backend'
import type { UserResponse } from '../../src/types/user'

export const customer: UserResponse = {
  id: 7,
  firstName: 'Mel',
  lastName: 'García',
  dateOfBirth: '1995-04-12',
  contactPhone: null,
  contactEmail: 'mel@booqi.com',
  role: 'CUSTOMER',
  createdAt: '2026-01-10T09:30:00',
  updatedAt: '2026-01-10T09:30:00',
}

export const admin: UserResponse = {
  ...customer,
  id: 1,
  firstName: 'Alex',
  lastName: 'Admin',
  contactEmail: 'admin@booqi.com',
  role: 'ADMIN',
}

export const PASSWORD = 'secreto123'

export type { MockState }

export function defaultState(): MockState {
  return {
    users: [admin, customer],
    events: [jazzEvent, rockEvent, foodEvent].map((event) => ({ ...event })),
    bookings: [],
    payments: [],
    passwords: { [admin.contactEmail]: PASSWORD, [customer.contactEmail]: PASSWORD },
    lastId: 1000,
  }
}

/** Answers every `/api/v1/...` request from an in-memory backend that mirrors the real rules. */
export async function mockApi(page: Page, state: MockState = defaultState()): Promise<MockState> {
  await page.route('**/api/v1/**', async (route: Route) => {
    const request = route.request()
    const url = new URL(request.url())
    const body = (request.postDataJSON() ?? {}) as Record<string, unknown>
    const reply = handleMockRequest(state, {
      method: request.method(),
      path: url.pathname,
      query: url.searchParams,
      body,
    })
    await route.fulfill({ status: reply.status, json: reply.json })
  })
  return state
}

export async function signInAs(page: Page, user: UserResponse) {
  await page.addInitScript(
    (stored) => localStorage.setItem('booqi-session', stored),
    JSON.stringify({ state: { user }, version: 0 }),
  )
}
