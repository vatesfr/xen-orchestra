export const ENABLED_AT_CUSTOMER = '[enabled at customer] '

/**
 * Prevents the configuration of a support bundle from acting on the customer infrastructure once imported
 *
 * - backup repositories and schedules are disabled: no mounts, no backup runs, the names of the schedules
 *   enabled by the customer are prefixed by ENABLED_AT_CUSTOMER to keep this information visible
 * - proxies and plugin configurations (placeholders which would fail the validation) are dropped
 * - servers point to the fake XAPIs and never learn the addresses of the original pool members,
 *   those without fake XAPI are disabled
 * - the user doing the import is kept over an imported one, since imported passwords are placeholders
 *
 * @param {Record<string, unknown[]>} config exported config entries
 * @param {{ currentUser: { id: string, email: string }, urlsByPool: Map<string, string> }} opts
 * @returns {Record<string, unknown[]>}
 */
export function neutralizeConfig(config, { currentUser, urlsByPool }) {
  const neutralizedConfig = {}
  for (const [entry, data] of Object.entries(config)) {
    if (entry === 'proxies') {
      continue
    }
    neutralizedConfig[entry] = Array.isArray(data) ? data.map(item => neutralizeItem(entry, item, urlsByPool)) : data
  }
  if (Array.isArray(neutralizedConfig.users)) {
    neutralizedConfig.users = neutralizedConfig.users.filter(
      user => user.id !== currentUser.id && user.email !== currentUser.email
    )
  }
  return neutralizedConfig
}

function neutralizeItem(entry, item, urlsByPool) {
  switch (entry) {
    case 'plugins': {
      const { configuration: _, ...plugin } = item
      return plugin
    }
    case 'remotes':
      return { ...item, enabled: false }
    case 'schedules':
      return item.enabled
        ? { ...item, enabled: false, name: ENABLED_AT_CUSTOMER + (item.name ?? '') }
        : { ...item, enabled: false }
    case 'xenServers': {
      const { poolMembersAddresses: _, ...server } = item
      const url = urlsByPool.get(server.poolId)
      return url === undefined ? { ...server, enabled: false } : { ...server, host: url, allowUnauthorized: true }
    }
    default:
      return item
  }
}
