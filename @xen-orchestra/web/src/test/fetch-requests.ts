import { BASE_URL } from '@/shared/utils/fetch.util.ts'

// Whether the stubbed `fetch` (see `setup.ts`, `stub-fetch-response.ts`) sent this request to the REST API, with this
// JSON body when one is given
export function hasRequested(method: string, endpoint: string, body?: unknown) {
  return vi.mocked(fetch).mock.calls.some(([url, options]) => {
    const isSameRequest = url === `${BASE_URL}/${endpoint}` && options?.method === method

    return isSameRequest && (body === undefined || options?.body === JSON.stringify(body))
  })
}
