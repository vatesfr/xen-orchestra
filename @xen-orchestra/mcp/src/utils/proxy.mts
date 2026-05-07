import { EnvHttpProxyAgent, type Dispatcher } from 'undici'

/**
 * `RequestInit` augmented with undici's `dispatcher` field. Node's global
 * `fetch` reads `dispatcher` correctly even though the DOM types don't expose
 * it — a localised cast at every call site would otherwise be needed.
 */
export type FetchInit = RequestInit & { dispatcher?: Dispatcher }

const PROXY_URL_VARS = ['HTTP_PROXY', 'http_proxy', 'HTTPS_PROXY', 'https_proxy'] as const
const ALL_PROXY_VARS = [...PROXY_URL_VARS, 'NO_PROXY', 'no_proxy'] as const

let cachedDispatcher: Dispatcher | undefined
let initialised = false

function hasAnyProxyEnv(): boolean {
  for (const key of PROXY_URL_VARS) {
    const value = process.env[key]
    if (value !== undefined && value !== '') return true
  }
  return false
}

/**
 * Returns a `Dispatcher` honouring `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY`,
 * or `undefined` when no proxy is configured (so that `fetch()` falls back to
 * the default global agent).
 *
 * The dispatcher is created lazily on the first call and reused for the whole
 * process — recreating one per request would lose the connection pool. Env
 * vars are read at first call, not at module load, so `dotenv` (and friends)
 * can populate them before the first MCP request.
 *
 * Never log the raw env var values: `HTTP_PROXY` may carry credentials in the
 * form `http://user:pass@proxy:port`.
 */
export function getProxyDispatcher(): Dispatcher | undefined {
  if (!initialised) {
    if (hasAnyProxyEnv()) {
      try {
        cachedDispatcher = new EnvHttpProxyAgent()
      } catch {
        // Don't echo the original error: it may include the env var value,
        // which can carry credentials.
        console.error('Failed to initialise proxy dispatcher; falling back to direct connections.')
      }
    }
    initialised = true
  }
  return cachedDispatcher
}

/** Test-only: drop the cached dispatcher so the next call re-reads env vars. */
export function resetProxyCache(): void {
  cachedDispatcher = undefined
  initialised = false
}

/**
 * Test-only: snapshot all proxy env vars and clear them. Returns a restore
 * function — call it from `afterEach`. Removes the duplicated env save/clear
 * boilerplate that would otherwise live in every test suite.
 */
export function snapshotProxyEnv(): () => void {
  const saved: Record<string, string | undefined> = {}
  for (const key of ALL_PROXY_VARS) {
    saved[key] = process.env[key]
    delete process.env[key]
  }
  return () => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}
