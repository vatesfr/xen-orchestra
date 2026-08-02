/**
 * Old deep links: /xo5/installation#<anchor> used to cover the whole
 * "from the sources" guide, which now lives on /install-from-sources.
 * The client-redirects plugin preserves the hash when forwarding
 * /xo5/installation to /installation; this module completes the trip
 * for the anchors that moved to the dedicated sources page.
 */
const MOVED_TO_SOURCES = new Set([
  'packages-and-prerequisites',
  'make-sure-redis-is-running',
  'fetching-the-code',
  'installing-dependencies',
  'running-xo',
  'updating',
  'always-running',
  'banner-and-warnings',
  'troubleshooting',
  'freebsd',
  'openbsd',
  'sudo',
])

export function onRouteDidUpdate({ location }: { location: { pathname: string; hash: string } }): void {
  if (typeof window === 'undefined') {
    return
  }
  const path = location.pathname.replace(/\/+$/, '')
  const anchor = location.hash.replace(/^#/, '')
  if (path === '/installation' && MOVED_TO_SOURCES.has(anchor)) {
    window.location.replace(`/install-from-sources#${anchor}`)
  }
}
