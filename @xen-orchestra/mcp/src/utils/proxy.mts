import { EnvHttpProxyAgent, fetch as undiciFetch, type Dispatcher, type RequestInit, type Response } from 'undici'

/** `RequestInit` augmented with undici's `dispatcher` field. */
export type FetchInit = RequestInit & { dispatcher?: Dispatcher }

export type FetchFn = (input: string | URL, init?: FetchInit) => Promise<Response>

let fetchImpl: FetchFn = undiciFetch as FetchFn

/**
 * undici's own `fetch`, used by every call site that passes a `dispatcher`.
 * Node's global `fetch` is backed by the copy of undici bundled inside Node,
 * and since undici 8 it rejects a dispatcher built from the standalone package
 * with `invalid onRequestStart method`.
 *
 * Indirected through `fetchImpl` so tests can substitute it, which assigning
 * `globalThis.fetch` no longer achieves now that the calls no longer go there.
 */
export const fetch: FetchFn = (input, init) => fetchImpl(input, init)

/** Test-only: substitute `fetch`. Returns a function restoring the previous one. */
export function setFetch(impl: FetchFn): () => void {
  const previous = fetchImpl
  fetchImpl = impl
  return () => {
    fetchImpl = previous
  }
}

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
