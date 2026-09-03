// @ts-check
import { createLogger } from '@xen-orchestra/log'

const { warn } = createLogger('xo:xapi:nbd-diagnostic')

// XAPI only runs an NBD server on the PIFs of the networks declaring one of these purposes
const NBD_NETWORK_PURPOSES = ['nbd', 'insecure_nbd']

const NBD_DEFAULT_PORT = 10809

/**
 * @typedef {{ address: string, port?: number }} NbdServerInfo
 */

/**
 * @param {ReadonlyArray<NbdServerInfo>} nbdInfos
 * @returns {string}
 */
export function formatNbdServers(nbdInfos) {
  return nbdInfos.map(({ address, port = NBD_DEFAULT_PORT }) => `${address}:${port}`).join(', ') || 'none'
}

/**
 * @param {any} xapi
 * @param {string} pifRef
 * @returns {string|undefined}
 */
function describePif(xapi, pifRef) {
  const pif = xapi.getObjectByRef(pifRef)
  if (pif === undefined) {
    return
  }
  const hostName = xapi.getObjectByRef(pif.host)?.name_label ?? pif.host
  if (!pif.IP) {
    // the usual misconfiguration: the network carries the NBD purpose but the host is not
    // addressable on it, so XAPI advertises the host's address of another network instead
    return `${hostName} has no IP on it`
  }
  return pif.currently_attached ? `${hostName}: ${pif.IP}` : `${hostName}: ${pif.IP} (PIF not attached)`
}

/**
 * Describe the NBD capable networks of the pool, and the address each host exposes on them.
 *
 * The addresses `VDI.get_nbd_info` advertises are the IP of the hosts on those networks: the two
 * usual causes of an unusable NBD setup are a network declaring the NBD purpose on which no host
 * has an IP, and an advertised address that XO/the proxy can't reach. Neither is visible from the
 * failed connections alone, hence this description. It is built from the event cache, so it costs
 * no XAPI call and is safe to build on the error path.
 *
 * @param {any} xapi
 * @returns {string|undefined} `undefined` when the cache can't answer
 */
export function describeNbdNetworks(xapi) {
  try {
    const objects = xapi.objects?.all
    if (objects === undefined) {
      return
    }
    const descriptions = []
    for (const object of Object.values(objects)) {
      const purposes = object.$type === 'network' ? object.purpose : undefined
      if (purposes === undefined || !purposes.some(purpose => NBD_NETWORK_PURPOSES.includes(purpose))) {
        continue
      }
      const pifs = (object.PIFs ?? []).map(pifRef => describePif(xapi, pifRef)).filter(_ => _ !== undefined)
      descriptions.push(
        `"${object.name_label}" (${purposes.join(', ')}): ${pifs.length > 0 ? pifs.join(', ') : 'no PIF'}`
      )
    }
    if (descriptions.length === 0) {
      return 'no network of this pool has the NBD purpose enabled'
    }
    return `NBD enabled networks: ${descriptions.join(' ; ')}`
  } catch (error) {
    // a diagnostic must never hide the failure it describes
    warn(`couldn't describe the NBD enabled networks`, { error })
  }
}

/**
 * Build the `NO_NBD_AVAILABLE` error reported to the user, completed with the state of the NBD
 * capable networks of the pool.
 *
 * @param {string} reason
 * @param {object} context
 * @param {any} context.xapi
 * @param {string} context.vdiRef
 * @param {Error} [context.cause]
 * @returns {Error}
 */
export function noNbdAvailableError(reason, { xapi, vdiRef, cause }) {
  const networks = describeNbdNetworks(xapi)
  /** @type {NodeJS.ErrnoException & { vdiRef?: string }} */
  const error = new Error(networks === undefined ? reason : `${reason}. ${networks}`)
  error.code = 'NO_NBD_AVAILABLE'
  error.cause = cause
  error.vdiRef = vdiRef
  return error
}
