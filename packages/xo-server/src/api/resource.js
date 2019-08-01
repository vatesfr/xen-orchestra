export async function downloadAndInstallResource({
  namespace,
  id,
  version,
  pool,
}) {
  if (!this.requestResource) {
    throw new Error('requestResource is not a function')
  }

  const xapi = this.getXapi(pool.id)
  const res = await this.requestFreeResource(namespace, id, version)

  await xapi.installSupplementalPackOnAllHosts(res)
  await xapi.pool.update_other_config(
    `${namespace}_pack_installation_time`,
    String(Math.floor(Date.now() / 1e3))
  )
}

downloadAndInstallResource.description =
  'Download and install a resource via cloud plugin'

downloadAndInstallResource.params = {
  id: { type: 'string' },
  namespace: { type: 'string' },
  version: { type: 'string' },
  pool: { type: 'string' },
}

downloadAndInstallResource.resolve = {
  pool: ['pool', 'pool', 'administrate'],
}

downloadAndInstallResource.permission = 'admin'
