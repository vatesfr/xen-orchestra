import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'
import { dirname, join } from 'node:path'
import { EventEmitter } from 'node:events'
import { parseFault } from '@vates/node-vsphere-soap'
import { pTimeout } from 'promise-toolbox'
import { setTimeout as delay } from 'node:timers/promises'
import { Agent } from 'undici'

import { findFreePort, formatNbdkitArgs, waitForPort } from './_nbdkit.mjs'
import { resolveDiskLocation } from './_paths.mjs'
import { getCertificateThumbprint } from './_thumbprint.mjs'
import { VDDK_LIB_PATH } from './_vddk.mjs'
import { COWD_HEADER_LENGTH, grainDirectoryToDataMap, parseCowdHeader } from './parsers/cowd.mjs'
import parseVmdk from './parsers/vmdk.mjs'
import parseVmsd from './parsers/vmsd.mjs'
import parseVmx from './parsers/vmx.mjs'
import { asArray, normalizeSoapValue } from './soap/normalize.mjs'
import { moRef, objectSpec, propertyFilterSpec, propertySpec, retrieveOptions, traversalSpec } from './soap/specs.mjs'
import { VimClient } from './soap/VimClient.mjs'
import xml2js from 'xml2js'
import { spawn } from 'node:child_process'
import NbdClient from '@vates/nbd-client'

import { tmpdir } from 'node:os'
import fs from 'node:fs/promises'

const { info, warn } = createLogger('xo:vmware-explorer:esxi')

export { VDDK_LIB_DIR, VDDK_LIB_PATH } from './_vddk.mjs'

const DEFAULT_DOWNLOAD_RETRIES = 4
// a vmdk descriptor is a text file of a few hundred bytes, but a long parentFileNameHint pushes
// its extent line further
const DESCRIPTOR_READ_LENGTH = 4096
// a vmdk descriptor is a small file, but the /folder endpoint of a host is not fast
const DESCRIPTOR_CONCURRENCY = 4
const DEFAULT_FETCH_PROPERTY_TIMEOUT = 60e3
const DEFAULT_HEADERS_TIMEOUT = 60e3
const DEFAULT_RETRY_DELAY = 2e3
// every caller of `#waitForTaskEnd` passes its own deadline, this is only the guardrail for the
// next one: the timeout is compared against, so an undefined one would poll for ever
const DEFAULT_TASK_TIMEOUT = 60e3
const MAX_RETRY_DELAY = 30e3
const MAX_TASK_POLL_DELAY = 5e3
const NBDKIT_KILL_TIMEOUT = 10e3
// connecting the vddk library to the host can be slow
const NBDKIT_READY_TIMEOUT = 60e3

// a failure which will not fix itself must not be retried: a missing file, a rejected
// authentication or a programming error only delay the report of the real problem
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504])
const SESSION_EXPIRED = 'ESXI_SESSION_EXPIRED'
const RETRYABLE_CODES = new Set([
  SESSION_EXPIRED,
  'ECONNABORTED',
  'ECONNREFUSED',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ENOTFOUND',
  'EPIPE',
  'ETIMEDOUT',
  'UND_ERR_BODY_TIMEOUT',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_SOCKET',
])

function isRetryableError(error) {
  // `fetch` reports a network failure as `TypeError: fetch failed`, with the real error as cause
  if (RETRYABLE_CODES.has(error?.code) || RETRYABLE_CODES.has(error?.cause?.code)) {
    return true
  }
  const status = error?.cause?.status
  if (status !== undefined) {
    return RETRYABLE_STATUS.has(status)
  }
  // the host did not send its response headers in time
  return error?.name === 'TimeoutError'
}

const noop = () => {}

// the options change what the server exports, so they are part of its identity
const nbdServerKey = (vmId, diskPath, { compression, singleLink, threads }) =>
  JSON.stringify([vmId, diskPath, singleLink, threads, compression])

const XML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }
const escapeXml = value => String(value).replace(/[&<>"']/g, character => XML_ESCAPES[character])

// `TaskInfo.error` is a LocalizedMethodFault: the concrete fault type is the `xsi:type` of its
// `fault` element, and the parser may expose it at either level depending on the response
const taskFaultType = error => error?.fault?.attributes?.['xsi:type'] ?? error?.attributes?.['xsi:type']
const taskFaultMessage = error => error?.localizedMessage ?? error?.fault?.localizedMessage

export default class Esxi extends EventEmitter {
  #connected
  #cookies
  #dcPaths // map datastore name => datacenter name
  #fetchImpl
  #host
  #httpsAgent
  #user
  #password
  #spawn
  #thumbprint
  #vimClient
  #nbdServers = new Map()

  /**
   * @param {string} host
   * @param {string} user
   * @param {string} password
   * @param {boolean} sslVerify
   * @param {object} [options]
   * @param {typeof globalThis.fetch} [options.fetch] - injectable fetch implementation, for tests
   * @param {typeof spawn} [options.spawn] - injectable process spawner, for tests
   * @param {object} [options.vimClient] - injectable SOAP client, for tests
   */
  constructor(
    host,
    user,
    password,
    sslVerify,
    { fetch: fetchImplementation, spawn: spawnImplementation, vimClient } = {}
  ) {
    super()
    this.#fetchImpl = fetchImplementation ?? globalThis.fetch
    this.#spawn = spawnImplementation ?? spawn
    this.#host = host.trim()
    this.#user = user
    this.#password = password
    if (!sslVerify) {
      this.#httpsAgent = new Agent({
        connect: {
          rejectUnauthorized: false,
        },
      })
    }

    this.#vimClient =
      vimClient ?? new VimClient(host, user, password, sslVerify, { onError: error => this.#onError(error) })

    // every method awaits this promise, the event is kept for the callers relying on it
    this.#connected = this.#connect()
    this.#connected.then(
      () => this.emit('ready'),
      error => this.#onError(error)
    )
  }

  async #connect() {
    await this.#vimClient.connect()
    // the datacenter of a datastore is needed to download a file from it
    await this.#computeDatacenters()
  }

  #onError(error) {
    // an 'error' event without any listener terminates the process, and a caller waiting for
    // 'ready' has no reason to still be listening once connected
    if (this.listenerCount('error') > 0) {
      this.emit('error', error)
    } else {
      warn('esxi client error', { error, host: this.#host })
    }
  }

  /**
   * Closes the session on the host.
   *
   * @returns {Promise<void>}
   */
  async close() {
    try {
      // the servers would only be reaped by `--exit-with-parent`, i.e. when this process ends
      await asyncEach([...this.#nbdServers.keys()], key => this.#killNbdServerByKey(key), {
        concurrency: 4,
        // every server must be tried: `asyncEach` stops on the first error by default, which would
        // leave the other ones running
        stopOnError: false,
      })
    } finally {
      // a server refusing to die must not leave the session open on the host, nor the sockets of
      // the agent
      await this.#vimClient.close()
      await this.#httpsAgent?.close()
    }
  }

  async #computeDatacenters() {
    // the names of the datastores are read in one call instead of one per datastore: a host with
    // many datastores used to issue as many requests, all in flight at the same time
    const [datacenters, datastores] = await Promise.all([
      // the datastore property is a collection of datastore ids
      this.search('Datacenter', ['name', 'datastore']),
      this.search('Datastore', ['name']),
    ])

    const dcPaths = {}
    for (const { datastore, name: datacenterName } of Object.values(datacenters)) {
      for (const reference of asArray(datastore?.ManagedObjectReference)) {
        const datastoreName = datastores[reference.$value]?.name
        if (datastoreName === undefined) {
          warn('a datastore of a datacenter is not listed', { datacenterName, datastore: reference.$value })
          continue
        }
        dcPaths[datastoreName] = datacenterName
      }
    }
    this.#dcPaths = dcPaths
  }

  #findDatacenter(dataStore) {
    const dcPath = this.#dcPaths?.[dataStore]
    if (dcPath === undefined) {
      warn("can't find datacenter for datastore", { datacenters: this.#dcPaths, dataStore })
      // an assertion error used to be thrown, naming neither the datastore nor the known ones
      const error = new Error(`can't find the datacenter of the datastore ${dataStore}`)
      error.code = 'DATACENTER_NOT_FOUND'
      error.dataStore = dataStore
      error.dataStores = Object.keys(this.#dcPaths ?? {})
      throw error
    }
    return dcPath
  }

  async #fetch(url, { range, signal, headersTimeout = DEFAULT_HEADERS_TIMEOUT } = {}) {
    const headers = {}
    if (this.#cookies !== undefined) {
      headers.cookie = this.#cookies
    } else {
      headers.Authorization = 'Basic ' + Buffer.from(this.#user + ':' + this.#password).toString('base64')
    }
    if (range !== undefined) {
      headers.Range = 'bytes=' + range
    }

    // the timeout covers the response headers only: the body of a disk legitimately takes hours,
    // an abort signal outliving the headers would cut the stream in the middle
    const controller = new AbortController()
    const timer = setTimeout(() => {
      controller.abort(new DOMException(`no response header after ${headersTimeout}ms`, 'TimeoutError'))
    }, headersTimeout)

    let res
    try {
      res = await this.#fetchImpl(url, {
        dispatcher: this.#httpsAgent,
        method: 'GET',
        headers,
        // the caller keeps the ability to abort the body
        signal: signal === undefined ? controller.signal : AbortSignal.any([controller.signal, signal]),
      })
    } finally {
      clearTimeout(timer)
    }

    if (res.status < 200 || res.status >= 300) {
      // the body must be consumed or the connection is never released, and it usually explains the
      // failure better than the status alone
      const body = await res.text().catch(() => undefined)
      const error = new Error(res.status + ' ' + res.statusText + ' ' + url)
      error.cause = { status: res.status, statusText: res.statusText, url: String(url), body: body?.slice(0, 2048) }
      if ((res.status === 401 || res.status === 403) && headers.cookie !== undefined) {
        // the session expired, which happens on an import lasting hours: forget it so that the
        // next attempt authenticates again
        this.#cookies = undefined
        error.code = SESSION_EXPIRED
      }
      throw error
    }

    if (range !== undefined && res.status !== 206) {
      // A host answers the whole file when the range covers it entirely: `/folder` does it for a
      // vmdk descriptor of a few hundred bytes read as `0-511`. That is harmless, since such an
      // answer starts at the first byte and holds no more than what was asked.
      //
      // Anything else is not the requested range, and reading it as if it were would silently use
      // the wrong offset, or as much memory as the file is big
      const [start, end] = range.split('-').map(Number)
      const rawLength = res.headers.get('content-length')
      const length = Number(rawLength)
      // an answer whose size is unknown ( chunked ) cannot be checked, and `Number(null)` is 0
      if (start !== 0 || rawLength === null || !Number.isInteger(length) || length > end - start + 1) {
        await res.body?.cancel()
        const error = new Error(
          `the range ${range} was ignored by the host (status ${res.status}, ${res.headers.get('content-length')} bytes) ${url}`
        )
        error.cause = { status: res.status, url: String(url), range, length }
        throw error
      }
    }

    const cookies = res.headers.getSetCookie?.() ?? []
    if (cookies.length > 0) {
      // reusing the session saves a full authentication on every range request
      this.#cookies = cookies.map(cookie => cookie.split(';')[0]).join('; ')
    }

    return res
  }

  async #download(dataStore, path, { range, signal } = {}) {
    // the datacenter of the datastore is only known once connected
    await this.#connected
    const url = new URL('https://localhost')
    url.host = this.#host
    url.pathname = '/folder/' + path
    url.searchParams.set('dcPath', this.#findDatacenter(dataStore))
    url.searchParams.set('dsName', dataStore)

    return this.#fetch(url, { range, signal })
  }

  /**
   * Downloads a file of a datastore, or a range of it.
   *
   * @param {string} dataStore - name of the datastore
   * @param {string} path - path of the file in the datastore
   * @param {object} [options]
   * @param {string} [options.range] - inclusive byte range, e.g. `0-511`
   * @param {number} [options.retries] - how many times a retryable failure is retried
   * @param {number} [options.retryDelay] - in ms, doubled at every attempt
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<Response>}
   */
  async download(
    dataStore,
    path,
    { range, retries = DEFAULT_DOWNLOAD_RETRIES, retryDelay = DEFAULT_RETRY_DELAY, signal } = {}
  ) {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.#download(dataStore, path, { range, signal })
      } catch (error) {
        signal?.throwIfAborted()
        // retrying a missing file or a rejected authentication only delays the failure
        if (attempt >= retries || !isRetryableError(error)) {
          throw error
        }
        const wait = Math.round(
          Math.min(retryDelay * 2 ** attempt, MAX_RETRY_DELAY) * (0.5 + Math.random() / 2) // jitter
        )
        warn('download failed, will retry', { attempt: attempt + 1, dataStore, delay: wait, error, path, range })
        await delay(wait, undefined, { signal })
      }
    }
  }

  // inspired from https://github.com/reedog117/node-vsphere-soap/blob/master/test/vsphere-soap.test.js#L95
  /**
   * Lists the objects of a type with the given properties.
   *
   * @param {string} type - "ComputeResource", "Datacenter", "Datastore", "DistributedVirtualSwitch",
   * "Folder", "HostSystem", "Network", "ResourcePool" or "VirtualMachine"
   * ( from https://github.com/vmware/govmomi/issues/2595#issuecomment-966604502 )
   * @param {ReadonlyArray<string>} properties
   * @param {object} [options]
   * @param {number} [options.maxObjects] - objects per page
   * @returns {Promise<Record<string, object>>} properties indexed by managed object reference
   */
  async search(type, properties, { maxObjects = 100 } = {}) {
    await this.#vimClient.connect()
    // get property collector
    const propertyCollector = this.#vimClient.serviceContent.propertyCollector
    // get view manager
    const viewManager = this.#vimClient.serviceContent.viewManager
    // get root folder
    const rootFolder = this.#vimClient.serviceContent.rootFolder
    let result = await this.#vimClient.call('CreateContainerView', {
      _this: viewManager,
      container: rootFolder,
      type: [type],
      recursive: true,
    })

    // build all the data structures needed to query all the vm names
    const containerView = result.returnval

    // the specs are built in schema order, and the `xsi:type` are mandatory or else the server may
    // mis-recognize the types
    const filterSpec = propertyFilterSpec({
      // every path has the same type, so one spec carries them all
      propSet: [propertySpec({ type, pathSet: properties })],
      objectSet: [
        objectSpec({
          obj: containerView,
          skip: true,
          selectSet: [traversalSpec({ name: 'traverseEntities', type: 'ContainerView', path: 'view', skip: false })],
        }),
      ],
    })

    const objects = {}
    // the token of the page being retrieved, as long as it has not been consumed
    let pendingToken
    try {
      result = await this.#vimClient.call('RetrievePropertiesEx', {
        _this: propertyCollector,
        specSet: [filterSpec],
        options: retrieveOptions({ maxObjects }),
      })

      for (;;) {
        // `returnval` is absent when no object matches
        const returnval = result?.returnval
        if (returnval === undefined) {
          break
        }

        for (const { obj, propSet } of asArray(returnval.objects)) {
          // an object can be split across pages
          const objectProperties = (objects[obj.$value] ??= {})
          // `propSet` is absent for an object with no readable property
          for (const { name, val } of asArray(propSet)) {
            objectProperties[name] = normalizeSoapValue(val)
          }
        }

        pendingToken = returnval.token
        if (pendingToken === undefined) {
          break
        }
        result = await this.#vimClient.call('ContinueRetrievePropertiesEx', {
          _this: propertyCollector,
          token: pendingToken,
        })
      }
    } finally {
      if (pendingToken !== undefined) {
        // the retrieval was not consumed entirely, the server keeps its results until then
        await this.#vimClient
          .call('CancelRetrievePropertiesEx', { _this: propertyCollector, token: pendingToken })
          .catch(error => warn('failed to cancel the property retrieval', { error, token: pendingToken }))
      }
      // a view is a server side resource: not destroying it leaks one per search
      await this.#vimClient
        .call('DestroyView', { _this: containerView })
        .catch(error => warn('failed to destroy the container view', { error, type }))
    }

    return objects
  }

  async #inspectVmdk(dataStores, currentDataStore, currentPath, filePath, { signal } = {}) {
    const { dataStore: diskDataStore, path: diskPath } = resolveDiskLocation({
      dataStores,
      currentDataStore,
      currentPath,
      filePath,
    })

    const vmdkRes = await this.download(diskDataStore, diskPath, { signal })
    const text = await vmdkRes.text()
    const parsed = parseVmdk(text)

    return {
      ...parsed,
      datastore: diskDataStore,
      path: dirname(diskPath),
      diskPath,
      descriptionLabel: '',
    }
  }

  async getAllVmMetadata() {
    const datas = await this.search('VirtualMachine', ['config', 'storage', 'runtime', 'layoutEx'])

    const metadata = []
    for (const [id, { config, layoutEx, runtime, storage }] of Object.entries(datas)) {
      // an incomplete VM, e.g. one being created: the fields below used to be dereferenced anyway,
      // which failed the whole listing. `config` can be reported without its `hardware` yet
      if (config?.hardware === undefined || runtime?.powerState === undefined || storage === undefined) {
        warn('ignoring a VM whose properties are incomplete', {
          id,
          missing: {
            'config.hardware': config?.hardware === undefined,
            'runtime.powerState': runtime?.powerState === undefined,
            storage: storage === undefined,
          },
        })
        continue
      }

      // vsan , maybe raw disk , that forbid access to a direct vmdk
      // descriptor may exist though with a .vmdk extension
      // structure of layoutEx is described in  https://developer.vmware.com/apis/1720/
      const layoutFiles = asArray(layoutEx?.file)
      let hasAllExtentsListed = true
      for (const disk of asArray(layoutEx?.disk)) {
        for (const link of asArray(disk.chain)) {
          const fileKeys = asArray(link.fileKey)
          // look for the disk extent data , not the descriptor
          if (!layoutFiles.some(file => fileKeys.includes(file.key) && file.type === 'diskExtent')) {
            hasAllExtentsListed = false
            break
          }
        }
        // one disk missing an extent is enough
        if (!hasAllExtentsListed) {
          break
        }
      }

      metadata.push({
        id,
        hasAllExtentsListed,
        nameLabel: config.name,
        memory: +config.hardware.memoryMB * 1024 * 1024,
        nCpus: +config.hardware.numCPU,
        guestToolsInstalled: false,
        firmware: config.firmware === 'efi' ? 'uefi' : config.firmware, // bios or uefi
        powerState: runtime.powerState,
        storage: asArray(storage.perDatastoreUsage).reduce(
          (prev, curr) => {
            return {
              used: prev.used + +(curr?.committed ?? 0),
              free: prev.free + +(curr?.uncommitted ?? 0),
            }
          },
          { used: 0, free: 0 }
        ),
      })
    }
    return metadata
  }

  async getTransferableVmMetadata(vmId, { signal } = {}) {
    const [config, runtime] = await Promise.all([
      this.fetchProperty('VirtualMachine', vmId, 'config', { signal }),
      this.fetchProperty('VirtualMachine', vmId, 'runtime', { signal }),
    ])

    const vmPathName = config.files[0].vmPathName[0]
    const matches = vmPathName.match(/^\[(.*)\] (.+\.vmx)$/)
    if (matches === null) {
      // destructuring the null used to throw a TypeError naming nothing
      const error = new Error(`can't parse the path of the vmx of the VM ${vmId}: ${vmPathName}`)
      error.vmId = vmId
      throw error
    }
    const [, dataStore, vmxPath] = matches

    const res = await this.download(dataStore, vmxPath, { signal })
    const vmx = parseVmx(await res.text())
    // list datastores
    const dataStores = {}
    Object.values(await this.search('Datastore', ['summary'])).forEach(({ summary }) => {
      dataStores[summary.url] = summary
    })

    const diskReferences = []
    const networks = []
    let cdrom = false

    for (const key of Object.keys(vmx)) {
      const channelMatches = key.match(/^(scsi|ide|ethernet|sata)[0-9]+$/)
      if (channelMatches === null) {
        continue
      }
      const channelType = channelMatches[1]
      if (channelType === 'ide' || channelType === 'scsi' || channelType === 'sata' /* cdrom */) {
        const diskChannel = vmx[key]
        // the indexes of the channel are its own: iterating the compacted values used to label a
        // channel holding only `scsi0:1` as `scsi0:0`, and `node` is the disk identity used to
        // build the chains and to order the VBDs
        for (const [diskIndex, disk] of Object.entries(diskChannel)) {
          if (typeof disk !== 'object' || disk === null) {
            continue
          }
          if (disk.deviceType?.match(/cdrom/i)) {
            cdrom = true
            continue
          }
          // can be something other than a disk, like a controller card
          if (channelType === 'scsi' && disk.deviceType !== 'scsi-hardDisk') {
            continue
          }

          diskReferences.push({ fileName: disk.fileName, node: `${key}:${diskIndex}` })
        }
      } else if (channelType === 'ethernet') {
        const ethernet = vmx[key]

        networks.push({
          label: ethernet.networkName,
          macAddress: ethernet.generatedAddress,
          isGenerated: ethernet.addressType === 'generated',
        })
      }
    }
    const inspect = fileName => this.#inspectVmdk(dataStores, dataStore, dirname(vmxPath), fileName, { signal })

    // one descriptor to download per disk: read serially, a long chain added a full round trip per
    // snapshot and per disk
    const disks = new Array(diskReferences.length)
    await asyncEach(
      diskReferences,
      async ({ fileName, node }, index) => {
        disks[index] = { ...(await inspect(fileName)), node }
      },
      { concurrency: DESCRIPTOR_CONCURRENCY, signal }
    )

    let snapshots
    try {
      const vmsd = await this.download(dataStore, vmxPath.replace(/\.vmx$/, '.vmsd'), { signal })
      snapshots = parseVmsd(await vmsd.text())
    } catch (error) {
      if (error.cause?.status !== 404) {
        // an unreadable vmsd used to be silently reported as "no snapshot", which turns a delta
        // transfer into a full one without telling anybody
        throw error
      }
      info('no vmsd file, the VM has no snapshot', { vmId })
    }

    if (snapshots !== undefined) {
      const snapshotDisks = []
      for (const snapshot of snapshots.snapshots ?? []) {
        for (const diskIndex of Object.keys(snapshot.disks ?? {})) {
          snapshotDisks.push({ disks: snapshot.disks, diskIndex })
        }
      }
      await asyncEach(
        snapshotDisks,
        async ({ disks: chainDisks, diskIndex }) => {
          const disk = chainDisks[diskIndex]
          chainDisks[diskIndex] = {
            node: disk?.node, // 'scsi0:0' , 'ide0:0', ...,
            ...(await inspect(disk.fileName)),
          }
        },
        { concurrency: DESCRIPTOR_CONCURRENCY, signal }
      )
    }

    return {
      name_label: config.name[0],
      memory: +config.hardware[0].memoryMB[0] * 1024 * 1024,
      nCpus: +config.hardware[0].numCPU[0],
      guestToolsInstalled: false,
      guestId: config.guestId[0],
      // every sibling is unwrapped, this one used to be returned as a one element array
      guestFullName: config.guestFullName[0],
      firmware: config.firmware[0] === 'efi' ? 'uefi' : config.firmware[0], // bios or uefi
      powerState: runtime.powerState[0],
      snapshots,
      cdrom,
      disks,
      networks,
      vmId,
    }
  }

  /**
   * Extracts the id of the task started by a `*_Task` method.
   *
   * @param {object} result - result of the call
   * @param {string} method
   * @returns {string}
   */
  #taskIdOf(result, method) {
    const taskId = result?.returnval?.$value
    if (taskId === undefined) {
      const error = new Error(`${method} did not return a task`)
      error.cause = result
      throw error
    }
    return taskId
  }

  /**
   * Polls a task until it ends.
   *
   * @param {string} taskId
   * @param {object} [options]
   * @param {string} [options.method] - name of the method which started the task, for the messages
   * @param {number} [options.timeout] - in ms, how long the task is given to complete
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<object>} the `info` of the successful task
   */
  async #waitForTaskEnd(taskId, { method = 'task', timeout = DEFAULT_TASK_TIMEOUT, signal } = {}) {
    const start = Date.now()
    let pollDelay = 500
    for (;;) {
      signal?.throwIfAborted()

      let info
      try {
        // https://developer.vmware.com/apis/1720/
        info = await this.#retrieveProperty('Task', taskId, 'info', { signal })
      } catch (error) {
        // the task keeps running on the host: a transient failure of a single poll must not fail
        // an operation which legitimately lasts hours, and be reported as if nothing was running
        if (!isRetryableError(error) || Date.now() - start >= timeout) {
          throw error
        }
        warn('failed to read the state of a task, will poll again', { error, method, taskId })
        await delay(pollDelay, undefined, { signal })
        pollDelay = Math.min(pollDelay * 2, MAX_TASK_POLL_DELAY)
        continue
      }

      const { state } = info

      if (state === 'success') {
        return info
      }

      if (state === 'error') {
        // don't burn the whole timeout on a task which already failed
        const error = new Error(`${method} failed: ${taskFaultMessage(info.error) ?? 'unknown fault'}`)
        error.code = taskFaultType(info.error)
        error.cause = info.error
        warn('task ended in error', { taskId, method, state, error })
        throw error
      }

      if (Date.now() - start >= timeout) {
        const error = new Error(`${method} did not complete within ${Math.round(timeout / 1000)}s (state: ${state})`)
        error.cause = info
        warn('task timed out', { taskId, method, state })
        throw error
      }

      await delay(pollDelay, undefined, { signal })
      pollDelay = Math.min(pollDelay * 2, MAX_TASK_POLL_DELAY)
    }
  }

  /**
   * Starts a vim25 method which returns a Task, and waits for that task to end.
   *
   * @param {string} method - name of the method, as exposed by the WSDL, e.g. `PowerOffVM_Task`
   * @param {object} args - arguments of the method. `_this` names the VM the task runs on, and is
   * attached to a failure. The schema declares them as a sequence, so they are sent in the order
   * they are given in here
   * @param {object} [options]
   * @param {number} [options.timeout] - in ms, how long the task is given to complete
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<object>} the `info` of the successful task
   */
  async #runTask(method, args, { signal, timeout } = {}) {
    const vmId = args._this
    const res = await this.#vimClient.call(method, args)
    try {
      return await this.#waitForTaskEnd(this.#taskIdOf(res, method), { method, signal, timeout })
    } catch (error) {
      error.vmId = vmId
      warn('a task on a VM failed', { error, method, vmId })
      throw error
    }
  }

  /**
   * Powers off a VM, and waits for it to be off.
   *
   * @param {string} vmId - id of the VM
   * @param {object} [options]
   * @param {number} [options.timeout] - in ms
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<object>} the `info` of the successful task
   */
  async powerOff(vmId, { signal, timeout = 5 * 60e3 } = {}) {
    return this.#runTask('PowerOffVM_Task', { _this: vmId }, { signal, timeout })
  }

  /**
   * Powers on a VM, and waits for the hypervisor to have started it.
   *
   * @param {string} vmId - id of the VM
   * @param {object} [options]
   * @param {number} [options.timeout] - in ms
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<object>} the `info` of the successful task
   */
  async powerOn(vmId, { signal, timeout = 5 * 60e3 } = {}) {
    return this.#runTask('PowerOnVM_Task', { _this: vmId }, { signal, timeout })
  }

  /**
   * Hard resets a running VM, making its guest reboot.
   *
   * Unlike a powerOff/powerOn pair this keeps the VM powered on as far as the hypervisor is
   * concerned, so the vmdk files are never closed: a snapshot delta keeps the CID it was
   * created with. Useful to make a guest write to its active disk without altering the
   * identity of the disks of the chain.
   *
   * @param {string} vmId - id of the VM, must be powered on
   * @param {object} [options]
   * @param {number} [options.timeout] - in ms
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<object>} the `info` of the successful task
   */
  async reset(vmId, { signal, timeout = 5 * 60e3 } = {}) {
    return this.#runTask('ResetVM_Task', { _this: vmId }, { signal, timeout })
  }

  /**
   * Removes every snapshot of a VM, consolidating their content into the base disks.
   *
   * @param {string} vmId - id of the VM
   * @param {object} [options]
   * @param {number} [options.timeout] - in ms, consolidating the deltas of a large disk takes as
   * long as it takes
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<object>} the `info` of the successful task
   */
  async removeAllSnapshots(vmId, { signal, timeout = 6 * 3600e3 } = {}) {
    return this.#runTask('RemoveAllSnapshots_Task', { _this: vmId, consolidate: true }, { signal, timeout })
  }

  /**
   * Takes a snapshot of a VM, without its memory.
   *
   * @param {string} vmId - id of the VM
   * @param {string} name
   * @param {string} description
   * @param {object} [options]
   * @param {number} [options.timeout] - in ms
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<object>} the `info` of the successful task
   */
  async snapshot(vmId, name, description, { signal, timeout = 30 * 60e3 } = {}) {
    return this.#runTask(
      'CreateSnapshotEx_Task',
      { _this: vmId, name, description, memory: false },
      { signal, timeout }
    )
  }

  /**
   * Reads one property of one managed object.
   *
   * Unlike {@link fetchProperty} this goes through the WSDL, and returns the value in the same
   * shape as {@link search}: this is the accessor new code should use.
   *
   * @param {string} type - type of the object, e.g. `VirtualMachine`
   * @param {string} id - managed object reference of the object
   * @param {string} path - property path, e.g. `config.hardware.device`
   * @param {object} [options]
   * @param {number} [options.timeout] - in ms
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<unknown>}
   */
  async #retrieveProperty(type, id, path, { timeout, signal } = {}) {
    signal?.throwIfAborted()
    await this.#vimClient.connect()
    const propertyCollector = this.#vimClient.serviceContent.propertyCollector

    const result = await this.#vimClient.call(
      'RetrievePropertiesEx',
      {
        _this: propertyCollector,
        specSet: [
          propertyFilterSpec({
            propSet: [propertySpec({ type, pathSet: [path] })],
            // the object itself, no container view to create and destroy
            objectSet: [objectSpec({ obj: moRef(type, id), skip: false })],
          }),
        ],
        options: retrieveOptions({}),
      },
      { timeout }
    )

    const returnval = result?.returnval
    if (returnval?.token !== undefined) {
      // a single property of a single object always fits in one page, but a retrieval left open
      // would keep its results on the server
      await this.#vimClient
        .call('CancelRetrievePropertiesEx', { _this: propertyCollector, token: returnval.token })
        .catch(error => warn('failed to cancel the property retrieval', { error, token: returnval.token }))
    }

    const property = asArray(asArray(returnval?.objects)[0]?.propSet).find(({ name }) => name === path)
    if (property === undefined) {
      // the object may have been deleted since it was listed
      const error = new Error(`can't get ${path} of object ${id} (Type: ${type})`)
      error.code = 'NO_PROPERTY'
      throw error
    }

    return normalizeSoapValue(property.val)
  }

  /**
   * Reads one property of one managed object through the undocumented `Fetch` method.
   *
   * @deprecated the values are wrapped in arrays by the XML parser, which is error prone. New code
   * must use the private `#retrieveProperty`, whose shape matches {@link search}.
   *
   * @param {string} type - type of the object, e.g. `VirtualMachine`
   * @param {string} id - managed object reference of the object
   * @param {string} propertyName
   * @param {object} [options]
   * @param {number} [options.timeout] - in ms
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<object>}
   */
  async fetchProperty(type, id, propertyName, { timeout = DEFAULT_FETCH_PROPERTY_TIMEOUT, signal } = {}) {
    // the fetch method does not seems to be exposed by the wsdl
    // inspired by the pyvmomi implementation ( StubAdapterAccessorImpl.py / InvokeAccessor)
    await this.#vimClient.connect()
    const url = new URL('https://localhost/sdk')
    url.host = this.#host
    const signals = [AbortSignal.timeout(timeout)]
    if (signal !== undefined) {
      signals.push(signal)
    }
    const res = await this.#fetchImpl(url, {
      method: 'POST',
      headers: {
        Cookie: this.#vimClient.authCookie.cookies,
        'content-type': 'text/xml; charset=utf-8',
        SOAPAction: '"urn:vim25/6.0"', // mandatory to have an answer when asking for httpNfcLease
      },
      dispatcher: this.#httpsAgent,
      signal: AbortSignal.any(signals),
      // the values are escaped: an id or a property path containing `<` or `&` would otherwise
      // break the envelope, or inject elements into it
      body: `<?xml version="1.0" encoding="UTF-8"?>
        <soapenv:Envelope
          xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/"
          xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xmlns:xsd="http://www.w3.org/2001/XMLSchema"
        >
          <soapenv:Body>
            <Fetch xmlns="urn:vim25">
              <_this type="${escapeXml(type)}">${escapeXml(id)}</_this>
              <prop >${escapeXml(propertyName)}</prop>
            </Fetch>
          </soapenv:Body>
        </soapenv:Envelope>`,
    })
    const text = await res.text()

    const matches = text.match(/<FetchResponse[^>]*>(.*)<\/FetchResponse>/s)
    if (matches === null) {
      // a fault does not contain a FetchResponse: report what the host complained about instead of
      // a generic message
      const { code, faultstring, localizedMessage } = parseFault({ body: text })
      const message = localizedMessage ?? faultstring
      const error = new Error(
        `can't get ${propertyName} of object ${id} (Type: ${type})${message !== undefined ? `: ${message}` : ''}`
      )
      error.code = code
      error.cause = { status: res.status, statusText: res.statusText, body: text.slice(0, 2048) }
      throw error
    }

    return new Promise((resolve, reject) => {
      xml2js.parseString(matches[1], (err, res) => (err ? reject(err) : resolve(res.returnval)))
    })
  }

  /**
   * SHA-1 fingerprint of the certificate of the host, as the vddk library expects it.
   *
   * Memoized: it used to be computed again for every nbdkit server, with two openssl processes
   * every time.
   *
   * @returns {Promise<string>}
   */
  async getServerThumbprint() {
    return (this.#thumbprint ??= this.#computeServerThumbprint().catch(error => {
      // a transient failure must not be memoized
      this.#thumbprint = undefined
      throw error
    }))
  }

  #computeServerThumbprint() {
    // the host may carry a port, e.g. `esxi.example:8443`, since it is used as the host of an url
    const { hostname, port } = new URL(`https://${this.#host}`)
    return getCertificateThumbprint(hostname.replace(/^\[|\]$/g, ''), port === '' ? {} : { port: Number(port) })
  }

  /**
   * Starts an nbdkit server exporting a disk of a VM, or returns the one already serving it.
   *
   * @param {string} vmId
   * @param {string} diskPath - `[datastore] dir/disk.vmdk`
   * @param {object} [options]
   * @param {string} [options.compression]
   * @param {boolean} [options.singleLink] - export the top delta only
   * @param {number} [options.threads]
   * @returns {Promise<{ nbdInfos: object, process: object }>}
   */
  async spawnNbdKitProcess(vmId, diskPath, { compression = 'fastlz', singleLink = false, threads = 1 } = {}) {
    const key = nbdServerKey(vmId, diskPath, { compression, singleLink, threads })

    let pending = this.#nbdServers.get(key)
    if (pending === undefined) {
      // the promise is memoized, not its result: the previous implementation had six await points
      // between the check and the registration, so two concurrent calls spawned two servers and
      // orphaned the first one
      pending = this.#spawnNbdKitProcess(vmId, diskPath, { compression, singleLink, threads })
      this.#nbdServers.set(key, pending)

      // neither a failed spawn nor a dead server must be handed out to the next caller
      const forget = () => {
        if (this.#nbdServers.get(key) === pending) {
          this.#nbdServers.delete(key)
        }
      }
      pending.then(server => server.died.then(forget), forget)
    }
    return pending
  }

  async #spawnNbdKitProcess(vmId, diskPath, { compression, singleLink, threads }) {
    const thumbprint = await this.getServerThumbprint()
    const port = await findFreePort()
    const tmpDir = await fs.mkdtemp(join(tmpdir(), 'xo-server'))
    const passFile = join(tmpDir, 'params')
    const outFd = await fs.open(join(tmpDir, 'stdout'), 'a')
    const errFd = await fs.open(join(tmpDir, 'stderr'), 'a')
    // the file holds a password, and only the directory was protecting it
    await fs.writeFile(passFile, this.#password, { mode: 0o600 })

    const args = formatNbdkitArgs({
      compression,
      diskPath,
      host: this.#host,
      libdir: VDDK_LIB_PATH,
      passFile,
      port,
      singleLink,
      threads,
      thumbprint,
      user: this.#user,
      vmId,
    })

    const nbdKitProcess = this.#spawn('nbdkit', args, {
      cwd: tmpDir,
      env: {
        ...process.env,
        LD_LIBRARY_PATH: `${VDDK_LIB_PATH}/lib64`,
      },
    })
    nbdKitProcess.stdout.pipe(outFd.createWriteStream())
    nbdKitProcess.stderr.pipe(errFd.createWriteStream())
    info(`nbdkit logs of ${diskPath} are in ${tmpDir}`)

    // `error` is emitted when the binary is missing: without a listener, it is an uncaught event
    // which terminates the whole process
    const died = new Promise(resolve => {
      nbdKitProcess.once('error', error => resolve({ error }))
      nbdKitProcess.once('exit', (code, signal) => resolve({ code, signal }))
    })

    died.then(async ({ code, error, signal }) => {
      await Promise.all([outFd.close().catch(noop), errFd.close().catch(noop)])
      if (error !== undefined) {
        warn('nbdkit could not be started', { args, error, tmpDir })
      } else if (code !== 0) {
        warn(`nbdkit server process exited with code ${code} ,detailed logs are in ${tmpDir}/stderr `, { signal })
      } else {
        // nothing to look at, the logs would pile up in the temporary directory
        await fs.rm(tmpDir, { force: true, recursive: true }).catch(noop)
      }
    })

    // the readiness of the server and its death are racing: nbdkit exits on a bad thumbprint or a
    // missing library, and waiting for the port would then burn the whole timeout
    const failed = died.then(({ code, error }) => {
      throw (
        error ?? new Error(`nbdkit exited with code ${code} before being ready, detailed logs are in ${tmpDir}/stderr`)
      )
    })
    failed.catch(noop) // the race is usually won by the readiness of the server

    const readiness = new AbortController()
    try {
      await Promise.race([waitForPort(port, { signal: readiness.signal, timeout: NBDKIT_READY_TIMEOUT }), failed])
    } catch (error) {
      await this.#killNbdServer({ died, process: nbdKitProcess }, diskPath).catch(noop)
      throw error
    } finally {
      // losing the race must not leave a probe running until its own timeout
      readiness.abort()
      // nbdkit reads the password once, while configuring its plugin, which is done by the time it
      // listens
      await fs.unlink(passFile).catch(error => warn('failed to remove the password file', { error, passFile }))
    }

    return {
      died,
      nbdInfos: { address: '127.0.0.1', port, exportname: diskPath },
      process: nbdKitProcess,
    }
  }

  async #killNbdServer(server, label) {
    const { died, process: nbdKitProcess } = server
    if (nbdKitProcess.exitCode !== null || nbdKitProcess.signalCode !== null) {
      return
    }
    nbdKitProcess.kill()
    try {
      await pTimeout.call(died, NBDKIT_KILL_TIMEOUT)
    } catch (error) {
      warn('nbdkit did not exit, killing it', { error, label, pid: nbdKitProcess.pid })
      nbdKitProcess.kill('SIGKILL')
      await died
    }
  }

  /**
   * Stops the nbdkit server exporting a disk, if any.
   *
   * @param {string} vmId
   * @param {string} diskPath - `[datastore] dir/disk.vmdk`
   * @param {object} [options] - must match the ones given to {@link spawnNbdKitProcess}
   * @returns {Promise<void>}
   */
  async killNbdServer(vmId, diskPath, { compression = 'fastlz', singleLink = false, threads = 1 } = {}) {
    return this.#killNbdServerByKey(nbdServerKey(vmId, diskPath, { compression, singleLink, threads }))
  }

  async #killNbdServerByKey(key) {
    const pending = this.#nbdServers.get(key)
    if (pending === undefined) {
      warn(`nbdkit server ${key} was already killed`)
      return
    }
    // the entry used to be left in place, so the next spawn handed out a dead process listening on
    // nothing
    this.#nbdServers.delete(key)

    let server
    try {
      server = await pending
    } catch {
      // the spawn failed, there is nothing left to kill
      return
    }
    await this.#killNbdServer(server, key)
  }

  async #getDataMapFromVddk(vmId, datastoreName, diskPath, signal) {
    let nbdClient
    try {
      const start = Date.now()

      const nbdInfoSpawn = await this.spawnNbdKitProcess(vmId, `[${datastoreName}] ${diskPath}`, {
        singleLink: true,
      })

      info(`nbd server for data map spawned`)
      signal?.throwIfAborted()

      nbdClient = new NbdClient(nbdInfoSpawn.nbdInfos)

      await nbdClient.connect()

      info(`nbd client for data map connected`)

      const dataMap = await nbdClient.getMap(signal)

      info(
        `got the data map of the single disk in ${Math.round((Date.now() - start) / 1000)} seconds ,${dataMap.length} blocks`
      )

      return dataMap
    } finally {
      // the client is undefined when the spawn of the server failed: the `TypeError` of the
      // previous `nbdClient.disconnect()` replaced the real error, and fed the fallback with a
      // misleading cause
      if (nbdClient !== undefined) {
        await nbdClient.disconnect().catch(error => warn('error while disconnecting the nbd client', { error }))
      }
      await this.killNbdServer(vmId, `[${datastoreName}] ${diskPath}`, { singleLink: true }).catch(error =>
        warn('error while stopping nbdkit server for the snapshot', { error })
      )
    }
  }

  async #readRange(datastoreName, path, start, length, signal) {
    // an HTTP range is inclusive: asking for `0-512` reads 513 bytes
    const res = await this.download(datastoreName, path, { range: `${start}-${start + length - 1}`, signal })
    return Buffer.from(await res.arrayBuffer())
  }

  async #getDataMapFromCowd(datastoreName, diskPath, signal) {
    const descriptor = await this.#readRange(datastoreName, diskPath, 0, DESCRIPTOR_READ_LENGTH, signal)
    let fileName
    try {
      fileName = parseVmdk(descriptor.toString('utf8')).fileName
    } catch (error) {
      // this is the fallback of a failure: an assertion error here would hide the real problem
      const wrapped = new Error(`can't read the descriptor of ${diskPath}`)
      wrapped.code = 'NO_DATA_MAP'
      wrapped.cause = error
      throw wrapped
    }

    const extentPath = diskPath.split('/').slice(0, -1).concat(fileName).join('/')

    const geometry = parseCowdHeader(await this.#readRange(datastoreName, extentPath, 0, COWD_HEADER_LENGTH, signal))
    const { grainDirectoryOffset, numGdEntries } = geometry

    const grainDirectory = await this.#readRange(
      datastoreName,
      extentPath,
      grainDirectoryOffset,
      numGdEntries * 4,
      signal
    )

    return grainDirectoryToDataMap(grainDirectory, geometry)
  }

  /**
   * Blocks of a disk which hold data, used to transfer a delta instead of the whole disk.
   *
   * @param {string} vmId
   * @param {string} datastoreName
   * @param {string} diskPath - path of the disk in its datastore
   * @param {AbortSignal} [signal]
   * @returns {Promise<Array<{ length: number, offset: number, type: number }>>}
   */
  async getDataMap(vmId, datastoreName, diskPath, signal) {
    try {
      // We await the result of getDataMapFromVddk so we can catch errors and fallback to the direct metadata reading.
      return await this.#getDataMapFromVddk(vmId, datastoreName, diskPath, signal)
    } catch (error) {
      signal?.throwIfAborted()
      warn('error while getting datamap from vddk, fall back to a direct metadata reading', { error })
      return this.#getDataMapFromCowd(datastoreName, diskPath, signal)
    }
  }
}
