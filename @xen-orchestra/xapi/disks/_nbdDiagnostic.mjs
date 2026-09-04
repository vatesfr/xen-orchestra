// @ts-check
import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'
import { Socket } from 'node:net'

const { warn } = createLogger('xo:xapi:nbd-diagnostic')

// XAPI only runs an NBD server on the PIFs of the networks declaring one of these purposes
const NBD_NETWORK_PURPOSES = ['nbd', 'insecure_nbd']

// XAPI's NBD server always listens on this port, whatever the network
const NBD_DEFAULT_PORT = 10809

const PROBE_CONCURRENCY = 8

// short on purpose: this runs on a path that already waited for the real connections to fail,
// and only answers "can this address be reached at all", not "does NBD work"
const PROBE_TIMEOUT = 5e3

/**
 * @typedef {{ address: string, port?: number }} NbdServerInfo
 *
 * @typedef {object} NbdHostAddress
 * @property {string|undefined} address `undefined` when the host has no IP on the network
 * @property {boolean} attached
 * @property {string} host
 *
 * @typedef {object} NbdNetwork
 * @property {NbdHostAddress[]} hosts
 * @property {string} name
 * @property {string[]} purposes
 *
 * @typedef {object} NbdSetup
 * @property {{ found: boolean, uuid: string }} [backupNetwork] set when the pool restricts
 * backups to a single network, in which case `networks` holds that one alone
 * @property {NbdNetwork[]} networks
 */

/**
 * @param {ReadonlyArray<NbdServerInfo>} nbdInfos
 * @returns {string}
 */
export function formatNbdServers(nbdInfos) {
  return nbdInfos.map(({ address, port = NBD_DEFAULT_PORT }) => `${address}:${port}`).join(', ') || 'none'
}

/**
 * @param {NbdNetwork} network
 * @returns {boolean}
 */
function hasNbdPurpose({ purposes }) {
  return purposes.some(purpose => NBD_NETWORK_PURPOSES.includes(purpose))
}

/**
 * @param {any} xapi
 * @param {any} network
 * @returns {NbdNetwork}
 */
function collectNetwork(xapi, network) {
  const hosts = []
  for (const pifRef of network.PIFs ?? []) {
    const pif = xapi.getObjectByRef(pifRef)
    if (pif === undefined) {
      continue
    }
    hosts.push({
      // an empty IP is how XAPI reports a PIF the host is not addressable on
      address: pif.IP ? pif.IP : undefined,
      attached: !!pif.currently_attached,
      host: xapi.getObjectByRef(pif.host)?.name_label ?? pif.host,
    })
  }
  return { hosts, name: network.name_label, purposes: network.purpose ?? [] }
}

/**
 * List the networks that can carry NBD traffic for this pool, from the xapi event cache: it costs
 * no XAPI call and is safe to build on the error path.
 *
 * @param {any} xapi
 * @returns {NbdSetup|undefined} `undefined` when the cache can't answer
 */
export function collectNbdSetup(xapi) {
  const objects = xapi.objects?.all
  if (objects === undefined) {
    return
  }
  const networks = Object.values(objects).filter(object => object.$type === 'network')

  const backupNetworkUuid = xapi._pool?.other_config?.['xo:backupNetwork']
  if (backupNetworkUuid) {
    // a pool backup network restricts every backup transfer to the addresses of the hosts on that
    // single network (see Xapi#_getHostBackupAddress), NBD included: the other NBD enabled
    // networks are then irrelevant, and reporting them would send the user looking at the wrong
    // one. It is reported even without the NBD purpose, since that alone makes NBD impossible.
    const backupNetwork = networks.find(({ uuid }) => uuid === backupNetworkUuid)
    return {
      backupNetwork: { found: backupNetwork !== undefined, uuid: backupNetworkUuid },
      networks: backupNetwork === undefined ? [] : [collectNetwork(xapi, backupNetwork)],
    }
  }

  return { networks: networks.map(network => collectNetwork(xapi, network)).filter(hasNbdPurpose) }
}

/**
 * Check whether a TCP connection to an NBD server can be established.
 *
 * Deliberately stops at the TCP level: a `reachable` address whose NBD connection still failed
 * points at the NBD server or its TLS, not at the network, which is the distinction the user
 * needs to know where to look.
 *
 * @param {string} address
 * @param {number} [port]
 * @param {number} [timeout]
 * @returns {Promise<string>}
 */
export function probeNbdAddress(address, port = NBD_DEFAULT_PORT, timeout = PROBE_TIMEOUT) {
  return new Promise(resolve => {
    const socket = new Socket()
    let settled = false
    const settle = verdict => {
      if (settled) {
        return
      }
      settled = true
      socket.destroy()
      resolve(verdict)
    }

    // set before connect(): it then also bounds the connection attempt itself
    socket.setTimeout(timeout)
    socket.once('connect', () => settle('reachable'))
    socket.once('timeout', () => settle(`unreachable (no answer after ${timeout}ms)`))
    socket.once('error', (/** @type {NodeJS.ErrnoException} */ error) =>
      settle(`unreachable (${error.code ?? error.message})`)
    )
    socket.connect(port, address)
  })
}

/**
 * @param {NbdNetwork} network
 * @param {Map<string, string>} verdictByAddress
 * @returns {string}
 */
function formatHosts({ hosts }, verdictByAddress) {
  if (hosts.length === 0) {
    return 'no PIF'
  }
  return hosts
    .map(({ address, attached, host }) => {
      if (address === undefined) {
        // the usual misconfiguration: the network carries the NBD purpose but the host is not
        // addressable on it, so XAPI advertises the host's address of another network instead
        return `${host} has no IP on it`
      }
      const state = attached ? '' : ' (PIF not attached)'
      return `${host}: ${address}${state} ${verdictByAddress.get(address) ?? 'not probed'}`
    })
    .join(', ')
}

/**
 * @param {NbdSetup} setup
 * @param {Map<string, string>} [verdictByAddress]
 * @returns {string}
 */
export function formatNbdSetup({ backupNetwork, networks }, verdictByAddress = new Map()) {
  if (backupNetwork !== undefined) {
    const only = `the pool backup network is the only one that can be used for NBD`
    if (!backupNetwork.found) {
      return `${only}, and ${backupNetwork.uuid} was not found in this pool`
    }
    const [network] = networks
    if (!hasNbdPurpose(network)) {
      return `${only}, and "${network.name}" does not have the NBD purpose enabled`
    }
    return `${only}: "${network.name}" (${network.purposes.join(', ')}): ${formatHosts(network, verdictByAddress)}`
  }

  if (networks.length === 0) {
    return 'no network of this pool has the NBD purpose enabled'
  }
  const descriptions = networks.map(
    network => `"${network.name}" (${network.purposes.join(', ')}): ${formatHosts(network, verdictByAddress)}`
  )
  return `NBD enabled networks: ${descriptions.join(' ; ')}`
}

/**
 * Describe the NBD capable networks of the pool, the address each host exposes on them, and
 * whether that address can be reached.
 *
 * The addresses `VDI.get_nbd_info` advertises are the IP of the hosts on those networks, so the
 * usual causes of an unusable NBD setup are a network declaring the NBD purpose on which no host
 * has an IP, an address XO/the proxy can't reach, and a pool backup network without the NBD
 * purpose. None of them is visible from the failed connections alone, hence this description.
 *
 * @param {any} xapi
 * @param {object} [options]
 * @param {number} [options.concurrency]
 * @param {number} [options.port]
 * @param {number} [options.timeout]
 * @returns {Promise<string|undefined>} `undefined` when the cache can't answer
 */
export async function describeNbdSetup(
  xapi,
  { concurrency = PROBE_CONCURRENCY, port = NBD_DEFAULT_PORT, timeout = PROBE_TIMEOUT } = {}
) {
  try {
    const setup = collectNbdSetup(xapi)
    if (setup === undefined) {
      return
    }

    const addresses = new Set()
    for (const { hosts } of setup.networks) {
      for (const { address } of hosts) {
        if (address !== undefined) {
          addresses.add(address)
        }
      }
    }

    /** @type {Map<string, string>} */
    const verdictByAddress = new Map()
    await asyncEach(
      addresses,
      async address => {
        verdictByAddress.set(address, await probeNbdAddress(address, port, timeout))
      },
      { concurrency, stopOnError: false }
    )

    return formatNbdSetup(setup, verdictByAddress)
  } catch (error) {
    // a diagnostic must never hide the failure it describes
    warn(`couldn't describe the NBD setup`, { error })
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
 * @returns {Promise<Error>}
 */
export async function noNbdAvailableError(reason, { xapi, vdiRef, cause }) {
  const setup = await describeNbdSetup(xapi)
  /** @type {NodeJS.ErrnoException & { vdiRef?: string }} */
  const error = new Error(setup === undefined ? reason : `${reason}. ${setup}`)
  error.code = 'NO_NBD_AVAILABLE'
  error.cause = cause
  error.vdiRef = vdiRef
  return error
}
