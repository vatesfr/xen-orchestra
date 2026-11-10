/**
 * Prevents the configuration of a support bundle from acting on the customer infrastructure once imported
 *
 * - backup repositories and schedules are disabled: no mounts, no backup runs
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
    case 'schedules':
      return { ...item, enabled: false }
    case 'xenServers': {
      const { poolMembersAddresses: _, ...server } = item
      const url = urlsByPool.get(server.poolId)
      return url === undefined ? { ...server, enabled: false } : { ...server, host: url, allowUnauthorized: true }
    }
    default:
      return item
  }
}
