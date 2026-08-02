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

/**
 * The old /xo5/xoa page was split across three pages; its redirect
 * lands on /installation, and these anchors complete the trip for
 * the sections that went elsewhere.
 */
const MOVED_FROM_XOA: Record<string, string> = {
  firewall: '/configuration#firewall',
  timezone: '/configuration#timezone',
  'setting-a-custom-ntp-server': '/configuration#setting-a-custom-ntp-server',
  'restart-the-service': '/configuration#restart-the-service',
  'technical-support': '/troubleshooting#still-stuck',
  'xoa-check': '/troubleshooting#first-reflex-xoa-check',
  'support-tunnel': '/troubleshooting#support-tunnel',
  'ssh-pro-support': '/troubleshooting#support-tunnel',
  'migrate-from-an-older-xoa': '/migrate_to_new_xoa',
}

export function onRouteDidUpdate({ location }: { location: { pathname: string; hash: string } }): void {
  if (typeof window === 'undefined') {
    return
  }
  const path = location.pathname.replace(/\/+$/, '')
  const anchor = location.hash.replace(/^#/, '')
  if (path === '/installation' && MOVED_TO_SOURCES.has(anchor)) {
    window.location.replace(`/install-from-sources#${anchor}`)
  }
  if (path === '/installation' && MOVED_FROM_XOA[anchor] !== undefined) {
    window.location.replace(MOVED_FROM_XOA[anchor])
  }
}
