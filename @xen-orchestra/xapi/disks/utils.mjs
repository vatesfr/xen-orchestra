import MultiNbdClient from '@vates/nbd-client/multi.mjs'
import { formatNbdServers, noNbdAvailableError } from './_nbdDiagnostic.mjs'

/**
 * Connect to the NBD servers XAPI advertises for a VDI.
 *
 * Every failure is reported as a `NO_NBD_AVAILABLE` error whose message states which of the three
 * steps failed (nothing advertised, everything filtered out by the backup network, nothing
 * reachable) and what to look at, since the caller can only fall back to a stream export — and,
 * when the base snapshot data has been destroyed by CBT, to a full.
 *
 * @param {any} xapi
 * @param {string} vdiRef
 * @param {number} nbdConcurrency
 * @returns {Promise<MultiNbdClient|undefined>}
 */
export async function connectNbdClientIfPossible(xapi, vdiRef, nbdConcurrency) {
  const advertisedServers = await xapi.call('VDI.get_nbd_info', vdiRef)

  if (advertisedServers.length === 0) {
    throw noNbdAvailableError(
      `XAPI advertises no NBD server for this VDI (VDI.get_nbd_info returned an empty list): the hosts able to reach its SR must have an IP address on a network with the NBD purpose enabled`,
      { xapi, vdiRef }
    )
  }

  // filter nbd to only use backup network ( if set )
  let nbdInfos = advertisedServers
  const poolBackupNetwork = xapi._pool.other_config['xo:backupNetwork']
  if (poolBackupNetwork) {
    const networkRef = await xapi.call('network.get_by_uuid', poolBackupNetwork)
    const pifs = await xapi.getField('network', networkRef, 'PIFs')
    // @todo implement ipv6
    const addresses = await Promise.all(pifs.map(pifRef => xapi.getField('PIF', pifRef, 'IP')))
    nbdInfos = advertisedServers.filter(({ address }) => addresses.includes(address))

    if (nbdInfos.length === 0) {
      const backupNetworkAddresses = addresses.filter(address => !!address)
      throw noNbdAvailableError(
        `none of the NBD servers advertised for this VDI (${formatNbdServers(advertisedServers)}) is on the backup network ${poolBackupNetwork} (${
          backupNetworkAddresses.length > 0 ? backupNetworkAddresses.join(', ') : 'no host has an IP on it'
        }): enable the NBD purpose on the backup network, or unset the backup network of the pool`,
        { xapi, vdiRef }
      )
    }
  }

  const nbdClient = new MultiNbdClient(nbdInfos, { nbdConcurrency })
  try {
    await nbdClient.connect()
  } catch (error) {
    throw noNbdAvailableError(
      `${error.message}: these addresses are the IP of the hosts on the NBD enabled networks, they must be reachable from XO/the proxy`,
      { xapi, vdiRef, cause: error }
    )
  }
  return nbdClient
}
