// Replaces the never-settling `fetch` of `src/test/setup.ts` for the current test only (it is stubbed again before each)
export function stubFetchResponse(status: number, body: unknown) {
  const fetchMock = vi.fn(
    async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  )

  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}

export const SERVER_ERROR_MESSAGE = 'unreachable'

// A failure the server explains with a message
export function stubFetchServerError() {
  return stubFetchResponse(500, { error: SERVER_ERROR_MESSAGE })
}
