import { BASE_URL } from '@/shared/utils/fetch.util.ts'

// Whether the stubbed `fetch` (see `setup.ts`, `stub-fetch-response.ts`) sent this request to the REST API
export function hasRequested(method: string, endpoint: string) {
  return vi
    .mocked(fetch)
    .mock.calls.some(([url, options]) => url === `${BASE_URL}/${endpoint}` && options?.method === method)
}
