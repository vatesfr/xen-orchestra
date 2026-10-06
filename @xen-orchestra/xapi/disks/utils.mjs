import MultiNbdClient from '@vates/nbd-client/multi.mjs'

/**
 * Whether xapi-nbd serves in TLS: same rule as xapi-nbd itself, TLS unless the pool only has networks with
 * the insecure_nbd purpose (it refuses connections when both purposes are set)
 *
 * @param {any} xapi
 * @returns {Promise<boolean>}
 */
async function isNbdTlsRequired(xapi) {
  const networks = Object.values(await xapi.call('network.get_all_records'))
  const purposes = networks.flatMap(network => network.purpose)
  return purposes.includes('nbd') || !purposes.includes('insecure_nbd')
}

/**
 *
 * @param {any} xapi
 * @param {string} vdiRef
 * @param {number} nbdConcurrency
 * @returns {Promise<MultiNbdClient|undefined>}
 */
export async function connectNbdClientIfPossible(xapi, vdiRef, nbdConcurrency) {
  let nbdInfos = await xapi.call('VDI.get_nbd_info', vdiRef)
  // filter nbd to only use backup network ( if set )
  const poolBackupNetwork = xapi._pool.other_config['xo:backupNetwork']
  if (poolBackupNetwork) {
    const networkRef = await xapi.call('network.get_by_uuid', poolBackupNetwork)
    const pifs = await xapi.getField('network', networkRef, 'PIFs')
    // @todo implement ipv6
    const addresses = await Promise.all(pifs.map(pifRef => xapi.getField('PIF', pifRef, 'IP')))
    nbdInfos = nbdInfos.filter(({ address }) => addresses.includes(address))
  }
  // VDI.get_nbd_info always gives the certificate, even when xapi-nbd serves in clear (insecure_nbd), and
  // the client upgrades to TLS whenever it has one: decide like xapi-nbd, from the network purposes, rather
  // than downgrading when the server refuses STARTTLS (which anyone on the path could force)
  if (!(await isNbdTlsRequired(xapi))) {
    nbdInfos = nbdInfos.map(({ cert: _cert, ...nbdInfo }) => nbdInfo)
  }

  if (nbdInfos.length === 0) {
    /** @type {NodeJS.ErrnoException} */
    const error = new Error(`can't connect to any nbd client`)
    error.code = 'NO_NBD_AVAILABLE'
    throw error
  }
  const nbdClient = new MultiNbdClient(nbdInfos, { nbdConcurrency })
  await nbdClient.connect()
  return nbdClient
}
