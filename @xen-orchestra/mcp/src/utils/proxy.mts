import { EnvHttpProxyAgent, fetch, type Dispatcher } from 'undici'

/**
 * `RequestInit` augmented with undici's `dispatcher` field.
 */
export type FetchInit = RequestInit & { dispatcher?: Dispatcher }

/** Signature used for dependency injection in tests (defaults to {@link proxyFetch}). */
export type FetchFn = (url: string, init?: FetchInit) => Promise<Response>

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

/**
 * undici-backed `fetch` so the proxy `dispatcher` (from the same undici copy)
 * is accepted. Node's global `fetch` is backed by Node's bundled undici and
 * rejects a dispatcher from the npm `undici` dependency with
 * `UND_ERR_INVALID_ARG` on some Node versions (e.g. Node 26), surfacing as
 * `fetch failed`. Routing every request through undici's own `fetch` keeps the
 * dispatcher and the fetch implementation consistent.
 *
 * undici's `RequestInit`/`Response` types differ subtly from the DOM lib types
 * (Blob / ReadableStream generics), so the boundary is cast here — the members
 * actually used (headers, signal, ok, status, text, json) are runtime-compatible.
 */
export function proxyFetch(url: string, init: FetchInit = {}): Promise<Response> {
  return fetch(url, { ...init, dispatcher: init.dispatcher ?? getProxyDispatcher() } as Parameters<
    typeof fetch
  >[1]) as Promise<Response>
}

/** Test-only: drop the cached dispatcher so the next call re-reads env vars. */
export function resetProxyCache(): void {
  cachedDispatcher = undefined
}
