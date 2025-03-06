import MultiNbdClient from '@vates/nbd-client/multi.mjs'

/**
 *
 * @param {any} xapi
 * @param {string} vdiRef
 * @param {number} nbdConcurrency
 * @returns {Promise<MultiNbdClient|undefined>}
 */
export async function connectNbdClientIfPossible(xapi, vdiRef, nbdConcurrency) {
  let nbdInfos = await xapi.call('VDI.get_nbd_info', vdiRef)
  if (nbdInfos.length > 0) {
    // filter nbd to only use backup network ( if set )
    const poolBackupNetwork = xapi._pool.other_config['xo:backupNetwork']
    if (poolBackupNetwork) {
      const networkRef = await xapi.call('network.get_by_uuid', poolBackupNetwork)
      const pifs = await xapi.getField('network', networkRef, 'PIFs')
      // @todo implement ipv6
      const adresses = await Promise.all(pifs.map(pifRef => xapi.getField('PIF', pifRef, 'IP')))
      nbdInfos = nbdInfos.filter(({ address }) => adresses.includes(address))
    }

    const nbdClient = new MultiNbdClient(nbdInfos, { nbdConcurrency })
    await nbdClient.connect()
    return nbdClient
  }
}
