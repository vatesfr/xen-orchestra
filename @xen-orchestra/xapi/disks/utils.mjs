import MultiNbdClient from '@vates/nbd-client/multi.mjs'
import NbdTcpClient from '@vates/nbd-client/NbdTcpClient.mjs'
import { BlockBufferPool } from '@xen-orchestra/disk-transform'
import { createLogger } from '@xen-orchestra/log'
import { NbdDiskWriter } from './NbdDiskWriter.mjs'

const { debug, info, warn } = createLogger('xo:xapi:disks:nbd')

const NBD_BLOCK_SIZE = 2 * 1024 * 1024

// shared by all the NBD exports of this process: reusing the block buffers instead of allocating 2MB per
// block keeps V8 from running a major GC dozens of times per second.
const NBD_BLOCK_POOL = new BlockBufferPool({ blockSize: NBD_BLOCK_SIZE, maxFree: 32 })

/**
 * Reads a block through NBD directly into a pooled buffer
 *
 * @param {MultiNbdClient} nbdClient
 * @param {number} index
 * @param {number} blockSize
 * @returns {Promise<import('@xen-orchestra/disk-transform').DiskBlock>}
 */
export async function readNbdBlock(nbdClient, index, blockSize) {
  if (blockSize !== NBD_BLOCK_SIZE) {
    return { index, data: await nbdClient.readBlock(index, blockSize) }
  }
  const { data, release } = NBD_BLOCK_POOL.acquire()
  let read
  try {
    read = await nbdClient.readBlock(index, blockSize, data)
  } catch (error) {
    // the failed connection does not parse anything anymore, nobody will write in this buffer
    release()
    throw error
  }
  return { index, data: read, release }
}

/**
 * The addresses of the backup network of the pool, undefined if none is set
 *
 * @param {any} xapi
 * @returns {Promise<string[]|undefined>}
 */
async function getBackupNetworkAddresses(xapi) {
  const poolBackupNetwork = xapi.pool.other_config['xo:backupNetwork']
  if (!poolBackupNetwork) {
    return undefined
  }
  const networkRef = await xapi.call('network.get_by_uuid', poolBackupNetwork)
  const pifs = await xapi.getField('network', networkRef, 'PIFs')
  // @todo implement ipv6
  return Promise.all(pifs.map(pifRef => xapi.getField('PIF', pifRef, 'IP')))
}

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

// the xo-nbd XAPI plugin serves the VDIs through its own NBD data server, faster than xapi-nbd
const NBD_PLUGIN = 'xo-nbd'

// unreachable plugin server: fall back to xapi-nbd quickly instead of waiting for the default 1 minute
const PLUGIN_CONNECT_TIMEOUT = 10e3

// a pool without the plugin is not asked again before this delay
const PLUGIN_ABSENCE_TTL = 10 * 60e3
const pluginAbsentUntil = new WeakMap()

/**
 * @param {any} xapi
 * @param {string} hostRef
 * @param {string} fn
 * @param {Record<string, string>} args
 */
async function callNbdPlugin(xapi, hostRef, fn, args) {
  return JSON.parse(await xapi.call('host.call_plugin', hostRef, NBD_PLUGIN, fn, args))
}

/**
 * A MultiNbdClient whose disconnection also closes the export of the plugin (which unplugs its VBD)
 */
class PluginNbdClient extends MultiNbdClient {
  #closeExport

  /**
   * @param {object[]} nbdInfos
   * @param {object} options
   * @param {() => Promise<void>} closeExport - only called once
   */
  constructor(nbdInfos, options, closeExport) {
    super(nbdInfos, options)
    this.#closeExport = closeExport
  }

  async disconnect() {
    try {
      await super.disconnect()
    } finally {
      await this.#closeExport()
    }
  }
}

/**
 * The hosts which can export the VDI through the xo-nbd plugin
 *
 * @param {any} xapi
 * @param {string} vdiUuid
 * @param {(address: string) => boolean} keepAddress
 * @returns {Promise<Array<{host: string}>|undefined>} undefined when the plugin is not usable on this pool
 */
async function getPluginCandidates(xapi, vdiUuid, keepAddress) {
  if (xapi.pool.other_config['xo:nbdPlugin'] === 'false' || (pluginAbsentUntil.get(xapi) ?? 0) > Date.now()) {
    return undefined
  }
  let candidates
  try {
    // any host can list the candidates: the hosts where the SR of the VDI is attached
    candidates = await callNbdPlugin(xapi, xapi.pool.master, 'get_nbd_infos', { vdi_uuid: vdiUuid })
  } catch (error) {
    if (error.code === 'XENAPI_MISSING_PLUGIN') {
      pluginAbsentUntil.set(xapi, Date.now() + PLUGIN_ABSENCE_TTL)
      debug('the xo-nbd plugin is not installed')
      return undefined
    }
    throw error
  }
  // in a random order to spread the exports on the hosts of a shared SR
  return candidates.filter(({ addresses }) => addresses.some(keepAddress)).sort(() => Math.random() - 0.5)
}

/**
 * Exports the VDI through the xo-nbd plugin and connects to it
 *
 * @param {any} xapi
 * @param {string} vdiRef
 * @param {number} nbdConcurrency
 * @param {string[]|undefined} backupAddresses - when set, only these addresses are used
 * @returns {Promise<MultiNbdClient|undefined>} undefined when the plugin is not usable: the caller falls back to xapi-nbd
 */
async function connectThroughPlugin(xapi, vdiRef, nbdConcurrency, backupAddresses) {
  const vdiUuid = await xapi.getField('VDI', vdiRef, 'uuid')
  const keepAddress = address => backupAddresses === undefined || backupAddresses.includes(address)
  const usable = await getPluginCandidates(xapi, vdiUuid, keepAddress)
  if (usable === undefined) {
    return undefined
  }
  for (const candidate of usable) {
    const hostRef = await xapi.call('host.get_by_uuid', candidate.host)
    let exported
    try {
      exported = await callNbdPlugin(xapi, hostRef, 'open', { vdi_uuid: vdiUuid })
    } catch (error) {
      warn('xo-nbd plugin: open failed, trying the next candidate', { vdiUuid, host: candidate.host, error })
      continue
    }
    // closed once, whoever asks first (a failed connection here, or the disconnection of the client)
    let closed
    const closeExport = () => {
      if (closed === undefined) {
        closed = callNbdPlugin(xapi, hostRef, 'close', { token: exported.exportname }).catch(error =>
          warn('xo-nbd plugin: close failed, the export will expire', { vdiUuid, host: candidate.host, error })
        )
      }
      return closed
    }

    const nbdInfos = exported.addresses.filter(keepAddress).map(address => ({
      address,
      port: exported.port,
      exportname: exported.exportname,
      // the client upgrades to TLS only when given a certificate
      cert: exported.tls ? exported.cert : undefined,
    }))
    const client = new PluginNbdClient(
      nbdInfos,
      { nbdConcurrency, connectTimeout: PLUGIN_CONNECT_TIMEOUT },
      closeExport
    )
    try {
      await client.connect()
      // the export must be this VDI: a different size means another disk, never read it as this one
      const virtualSize = BigInt(await xapi.getField('VDI', vdiRef, 'virtual_size'))
      if (BigInt(client.exportSize) !== virtualSize) {
        throw new Error(`export size ${client.exportSize} differs from the VDI virtual size ${virtualSize}`)
      }
      info('xo-nbd plugin: connected', { vdiUuid, host: candidate.host, tls: exported.tls })
      return client
    } catch (error) {
      warn('xo-nbd plugin: connection failed, trying the next candidate', { vdiUuid, host: candidate.host, error })
      await client.disconnect().catch(() => {})
      await closeExport()
    }
  }
  return undefined
}

/**
 * Exports the VDI in write mode through the xo-nbd plugin, and connects a single NBD client to it
 *
 * xapi-nbd only exports read-only: without the plugin, the caller imports the data through XAPI
 *
 * @param {any} xapi
 * @param {string} vdiRef - must not be a snapshot nor be attached (dom0 included)
 * @returns {Promise<NbdDiskWriter|undefined>} undefined when the VDI can't be exported in write mode
 */
export async function openNbdDiskWriter(xapi, vdiRef) {
  const backupAddresses = await getBackupNetworkAddresses(xapi)
  const keepAddress = address => backupAddresses === undefined || backupAddresses.includes(address)
  const vdiUuid = await xapi.getField('VDI', vdiRef, 'uuid')
  const usable = await getPluginCandidates(xapi, vdiUuid, keepAddress)
  if (usable === undefined) {
    return undefined
  }
  for (const candidate of usable) {
    const hostRef = await xapi.call('host.get_by_uuid', candidate.host)
    let exported
    try {
      exported = await callNbdPlugin(xapi, hostRef, 'open', { vdi_uuid: vdiUuid, mode: 'w' })
    } catch (error) {
      warn('xo-nbd plugin: open in write mode failed, trying the next candidate', {
        vdiUuid,
        host: candidate.host,
        error,
      })
      continue
    }
    // the written data are only guaranteed once it succeeded
    const closeExport = () => callNbdPlugin(xapi, hostRef, 'close', { token: exported.exportname })

    if (exported.writable) {
      const virtualSize = BigInt(await xapi.getField('VDI', vdiRef, 'virtual_size'))
      // a single connection: the first address which answers
      for (const address of exported.addresses.filter(keepAddress)) {
        const client = new NbdTcpClient(
          {
            address,
            port: exported.port,
            exportname: exported.exportname,
            // the client upgrades to TLS only when given a certificate
            cert: exported.tls ? exported.cert : undefined,
          },
          { connectTimeout: PLUGIN_CONNECT_TIMEOUT }
        )
        try {
          await client.connect()
          if (client.readOnly) {
            throw new Error('the export is read-only')
          }
          // the export must be this VDI: a different size means another disk, never write it
          if (BigInt(client.exportSize) !== virtualSize) {
            throw new Error(`export size ${client.exportSize} differs from the VDI virtual size ${virtualSize}`)
          }
          info('xo-nbd plugin: connected in write mode', { vdiUuid, host: candidate.host, tls: exported.tls })
          return new NbdDiskWriter(client, closeExport)
        } catch (error) {
          warn('xo-nbd plugin: write connection failed', { vdiUuid, host: candidate.host, address, error })
          await client.disconnect().catch(() => {})
        }
      }
    } else {
      warn('xo-nbd plugin: the export is not writable', { vdiUuid, host: candidate.host })
    }
    await closeExport().catch(error =>
      warn('xo-nbd plugin: close failed, the export will expire', { vdiUuid, host: candidate.host, error })
    )
  }
  return undefined
}

/**
 * Connects to the VDI through the xo-nbd plugin if it is installed, otherwise (or if it fails) through xapi-nbd
 *
 * @param {any} xapi
 * @param {string} vdiRef
 * @param {number} nbdConcurrency
 * @returns {Promise<MultiNbdClient|undefined>}
 */
export async function connectNbdClientIfPossible(xapi, vdiRef, nbdConcurrency) {
  // filter nbd to only use backup network ( if set )
  const backupAddresses = await getBackupNetworkAddresses(xapi)

  try {
    const client = await connectThroughPlugin(xapi, vdiRef, nbdConcurrency, backupAddresses)
    if (client !== undefined) {
      return client
    }
  } catch (error) {
    warn('xo-nbd plugin unusable, falling back to xapi-nbd', { error })
  }

  let nbdInfos = await xapi.call('VDI.get_nbd_info', vdiRef)
  if (backupAddresses !== undefined) {
    nbdInfos = nbdInfos.filter(({ address }) => backupAddresses.includes(address))
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
