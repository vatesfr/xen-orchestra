/**
 * Old deep links: /xo5/installation#<anchor> used to cover the whole
 * "from the sources" guide, which now lives on /setup-and-config/install-from-sources.
 * The client-redirects plugin preserves the hash when forwarding
 * /xo5/installation to /getting-started/installation; this module completes the trip
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
  firewall: '/setup-and-config/configuration#firewall',
  timezone: '/setup-and-config/configuration#timezone',
  'setting-a-custom-ntp-server': '/setup-and-config/configuration#setting-a-custom-ntp-server',
  'restart-the-service': '/setup-and-config/configuration#restart-the-service',
  'technical-support': '/support-and-reference/troubleshooting#still-stuck',
  'xoa-check': '/support-and-reference/troubleshooting#first-reflex-xoa-check',
  'support-tunnel': '/support-and-reference/troubleshooting#support-tunnel',
  'ssh-pro-support': '/support-and-reference/troubleshooting#support-tunnel',
  'migrate-from-an-older-xoa': '/setup-and-config/migrate_to_new_xoa',
}

/**
 * The old /xo6/purchase and /xo5/license_management pages moved to the
 * central Vates docs; their redirect lands on /support, and these
 * anchors complete the trip to the right page over there.
 */
const MOVED_TO_VATES_DOCS: Record<string, string> = {
  'direct-purchase': 'https://docs.vates.tech/pricing-licencing/vms-bundle-overview/',
  'via-your-purchase-departement': 'https://docs.vates.tech/pricing-licencing/contact-quote-requests/',
  invoices: 'https://docs.vates.tech/pricing-licencing/account-management/',
  'ask-for-a-quote': 'https://docs.vates.tech/pricing-licencing/contact-quote-requests/',
  'edit-your-card-information': 'https://docs.vates.tech/pricing-licencing/account-management/',
  'upgrade-your-plan': 'https://docs.vates.tech/pricing-licencing/vms-bundle-overview/',
  'activate-a-xen-orchestra-license': 'https://docs.vates.tech/pricing-licencing/applying-xo-licences/',
  'rebind-xo-license': 'https://docs.vates.tech/pricing-licencing/migrating-licences/',
}

export function onRouteDidUpdate({ location }: { location: { pathname: string; hash: string } }): void {
  if (typeof window === 'undefined') {
    return
  }
  const path = location.pathname.replace(/\/+$/, '')
  const anchor = location.hash.replace(/^#/, '')
  if (path === '/getting-started/installation' && MOVED_TO_SOURCES.has(anchor)) {
    window.location.replace(`/setup-and-config/install-from-sources#${anchor}`)
  }
  if (path === '/getting-started/installation' && MOVED_FROM_XOA[anchor] !== undefined) {
    window.location.replace(MOVED_FROM_XOA[anchor])
  }
  if (path === '/support-and-reference/support' && MOVED_TO_VATES_DOCS[anchor] !== undefined) {
    window.location.replace(MOVED_TO_VATES_DOCS[anchor])
  }
}
