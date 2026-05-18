import { EnvHttpProxyAgent, type Dispatcher } from 'undici'

/**
 * `RequestInit` augmented with undici's `dispatcher` field. Node's global
 * `fetch` reads `dispatcher` correctly even though the DOM types don't expose
 * it — a localised cast at every call site would otherwise be needed.
 */
export type FetchInit = RequestInit & { dispatcher?: Dispatcher }

let cachedDispatcher: Dispatcher | undefined

/**
 * Returns a `Dispatcher` honouring `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY`.
 * Env-var parsing — including the lowercase variants and malformed-URL
 * handling — is delegated to undici's `EnvHttpProxyAgent`; if no proxy var is
 * set, the agent just routes everything direct.
 *
 * Created lazily and reused for the whole process — recreating one per request
 * would lose the connection pool.
 */
export function getProxyDispatcher(): Dispatcher {
  if (!cachedDispatcher) {
    cachedDispatcher = new EnvHttpProxyAgent()
  }
  return cachedDispatcher
}

/** Test-only: drop the cached dispatcher so the next call re-reads env vars. */
export function resetProxyCache(): void {
  cachedDispatcher = undefined
}
