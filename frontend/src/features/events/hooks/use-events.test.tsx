import { renderHook, waitFor } from '@testing-library/react'
import { installFakeApi } from '../../../test/fake-api'
import { jazzEvent, rockEvent } from '../../../test/fixtures/events'
import { hookWrapper } from '../../../test/hook-wrapper'
import { eventKeys } from '../api/events-api'
import { useEvent, useEvents } from './use-events'

describe('useEvents', () => {
  it('loads every event under the shared key', async () => {
    const api = installFakeApi()
    api.get('/api/v1/events', { status: 200, data: [jazzEvent, rockEvent] })
    const { wrapper, queryClient } = hookWrapper()

    const { result } = renderHook(() => useEvents(), { wrapper })

    await waitFor(() => expect(result.current.data).toEqual([jazzEvent, rockEvent]))
    expect(queryClient.getQueryData(eventKeys.all)).toEqual([jazzEvent, rockEvent])
  })
})

describe('useEvent', () => {
  it('loads one event under its detail key', async () => {
    const api = installFakeApi()
    api.get('/api/v1/events/4', { status: 200, data: jazzEvent })
    const { wrapper, queryClient } = hookWrapper()

    const { result } = renderHook(() => useEvent(4), { wrapper })

    await waitFor(() => expect(result.current.data).toEqual(jazzEvent))
    expect(queryClient.getQueryData(eventKeys.detail(4))).toEqual(jazzEvent)
    expect(api.requests.map((request) => request.url)).toEqual(['/api/v1/events/4'])
  })
})
