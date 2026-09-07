import { createLogger } from '@xen-orchestra/log'
import { dirname, join } from 'node:path'
import { EventEmitter } from 'node:events'
import { parseFault } from '@vates/node-vsphere-soap'
import { setTimeout as delay } from 'node:timers/promises'
import { strictEqual, notStrictEqual } from 'node:assert'
import { Agent } from 'undici'

import parseVmdk from './parsers/vmdk.mjs'
import parseVmsd from './parsers/vmsd.mjs'
import parseVmx from './parsers/vmx.mjs'
import { asArray, normalizeSoapValue } from './soap/normalize.mjs'
import { moRef, objectSpec, propertyFilterSpec, propertySpec, retrieveOptions, traversalSpec } from './soap/specs.mjs'
import { VimClient } from './soap/VimClient.mjs'
import xml2js from 'xml2js'
import { exec, spawn } from 'node:child_process'
import NbdClient from '@vates/nbd-client'

import { tmpdir } from 'node:os'
import fs from 'node:fs/promises'

const { info, warn } = createLogger('xo:vmware-explorer:esxi')

export const VDDK_LIB_DIR = '/usr/local/lib/vddk'
export const VDDK_LIB_PATH = `${VDDK_LIB_DIR}/vmware-vix-disklib-distrib`
let nbdPort = 11000

const DEFAULT_DOWNLOAD_RETRIES = 4
const DEFAULT_FETCH_PROPERTY_TIMEOUT = 60e3
const DEFAULT_HEADERS_TIMEOUT = 60e3
const DEFAULT_RETRY_DELAY = 2e3
const DEFAULT_TASK_TIMEOUT = 60e3
const MAX_RETRY_DELAY = 30e3
const MAX_TASK_POLL_DELAY = 5e3

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
  #vimClient
  #nbdServers = new Map()

  /**
   * @param {string} host
   * @param {string} user
   * @param {string} password
   * @param {boolean} sslVerify
   * @param {object} [options]
   * @param {typeof globalThis.fetch} [options.fetch] - injectable fetch implementation, for tests
   * @param {object} [options.vimClient] - injectable SOAP client, for tests
   */
  constructor(host, user, password, sslVerify, { fetch: fetchImplementation, vimClient } = {}) {
    super()
    this.#fetchImpl = fetchImplementation ?? globalThis.fetch
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
    await this.#vimClient.close()
    await this.#httpsAgent?.close()
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
    try {
      notStrictEqual(this.#dcPaths, undefined)
      notStrictEqual(this.#dcPaths[dataStore], undefined)
    } catch (error) {
      warn("can't find datacenter for datastore", { datacenters: this.#dcPaths, dataStore })
      throw error
    }
    return this.#dcPaths[dataStore]
  }

  /**
   * Runs a vim25 method.
   *
   * @param {string} cmd - name of the method, as exposed by the WSDL
   * @param {object} [args] - arguments of the method, `_this` included
   * @param {object} [options]
   * @param {number} [options.timeout] - in ms
   * @returns {Promise<object>}
   */
  #exec(cmd, args, options) {
    return this.#vimClient.call(cmd, args, options)
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
    let result = await this.#exec('CreateContainerView', {
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
      result = await this.#exec('RetrievePropertiesEx', {
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
        result = await this.#exec('ContinueRetrievePropertiesEx', { _this: propertyCollector, token: pendingToken })
      }
    } finally {
      if (pendingToken !== undefined) {
        // the retrieval was not consumed entirely, the server keeps its results until then
        await this.#exec('CancelRetrievePropertiesEx', { _this: propertyCollector, token: pendingToken }).catch(error =>
          warn('failed to cancel the property retrieval', { error, token: pendingToken })
        )
      }
      // a view is a server side resource: not destroying it leaks one per search
      await this.#exec('DestroyView', { _this: containerView }).catch(error =>
        warn('failed to destroy the container view', { error, type })
      )
    }

    return objects
  }

  async #inspectVmdk(dataStores, currentDataStore, currentPath, filePath) {
    let diskDataStore, diskPath
    if (filePath.startsWith('/')) {
      // disk is on another datastore
      Object.keys(dataStores).forEach(dataStoreUrl => {
        if (filePath.startsWith(dataStoreUrl)) {
          diskDataStore = dataStores[dataStoreUrl].name
          diskPath = filePath.substring(dataStoreUrl.length + 1)
        }
      })
    } else {
      diskDataStore = currentDataStore
      diskPath = currentPath + '/' + filePath
    }
    const vmdkRes = await this.download(diskDataStore, diskPath)
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

    return Object.keys(datas)
      .map(id => {
        const { config, layoutEx, storage, runtime } = datas[id]
        if (storage === undefined || config === undefined) {
          return undefined
        }
        // vsan , maybe raw disk , that forbid access to a direct vmdk
        // descriptor may exist though with a .vmdk extension
        let hasAllExtentsListed = true

        // structure of layoutEx is described in  https://developer.vmware.com/apis/1720/
        layoutEx?.disk?.forEach(disk => {
          // we can stop, even if only one disk is missing an extent
          hasAllExtentsListed &&
            disk.chain?.forEach(({ fileKey: fileKeys }) => {
              // look for the disk extent data , not the descriptor
              const fileExtent = layoutEx.file.find(file => {
                return fileKeys.includes(file.key) && file.type === 'diskExtent'
              })
              hasAllExtentsListed = hasAllExtentsListed && fileExtent !== undefined
            })
        })
        const perDatastoreUsage = Array.isArray(storage.perDatastoreUsage)
          ? storage.perDatastoreUsage
          : [storage.perDatastoreUsage]
        return {
          id,
          hasAllExtentsListed,
          nameLabel: config.name,
          memory: +config.hardware.memoryMB * 1024 * 1024,
          nCpus: +config.hardware.numCPU,
          guestToolsInstalled: false,
          firmware: config.firmware === 'efi' ? 'uefi' : config.firmware, // bios or uefi
          powerState: runtime.powerState,
          storage: perDatastoreUsage.reduce(
            (prev, curr) => {
              return {
                used: prev.used + +(curr?.committed ?? 0),
                free: prev.free + +(curr?.uncommitted ?? 0),
              }
            },
            { used: 0, free: 0 }
          ),
        }
      })
      .filter(_ => _ !== undefined)
  }

  async getTransferableVmMetadata(vmId) {
    const [config, runtime] = await Promise.all([
      this.fetchProperty('VirtualMachine', vmId, 'config'),
      this.fetchProperty('VirtualMachine', vmId, 'runtime'),
    ])
    const [, dataStore, vmxPath] = config.files[0].vmPathName[0].match(/^\[(.*)\] (.+.vmx)$/)
    const res = await this.download(dataStore, vmxPath)
    const vmx = parseVmx(await res.text())
    // list datastores
    const dataStores = {}
    Object.values(await this.search('Datastore', ['summary'])).forEach(({ summary }) => {
      dataStores[summary.url] = summary
    })

    const disks = []
    const networks = []
    let cdrom = false

    for (const key of Object.keys(vmx)) {
      const matches = key.match(/^(scsi|ide|ethernet|sata)[0-9]+$/)
      if (matches === null) {
        continue
      }
      const channelType = matches[1]
      if (channelType === 'ide' || channelType === 'scsi' || channelType === 'sata' /* cdrom */) {
        const diskChannel = vmx[key]
        for (const diskIndex in Object.values(diskChannel)) {
          const disk = diskChannel[diskIndex]
          if (typeof disk !== 'object') {
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

          disks.push({
            ...(await this.#inspectVmdk(dataStores, dataStore, dirname(vmxPath), disk.fileName)),
            node: `${key}:${diskIndex}`,
          })
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
    let snapshots
    try {
      const vmsd = await (await this.download(dataStore, vmxPath.replace(/\.vmx$/, '.vmsd'))).text()
      snapshots = parseVmsd(vmsd)

      for (const snapshotIndex in snapshots?.snapshots) {
        const snapshot = snapshots.snapshots[snapshotIndex]
        for (const diskIndex in snapshot.disks) {
          const fileName = snapshot.disks[diskIndex].fileName
          snapshot.disks[diskIndex] = {
            node: snapshot.disks[diskIndex]?.node, // 'scsi0:0' , 'ide0:0', ...,
            ...(await this.#inspectVmdk(dataStores, dataStore, dirname(vmxPath), fileName)),
          }
        }
      }
    } catch (error) {
      // no vmsd file :fall back to a full without snapshots
    }
    return {
      name_label: config.name[0],
      memory: +config.hardware[0].memoryMB[0] * 1024 * 1024,
      nCpus: +config.hardware[0].numCPU[0],
      guestToolsInstalled: false,
      guestId: config.guestId[0],
      guestFullName: config.guestFullName,
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

  async powerOff(vmId, { signal, timeout = 5 * 60e3 } = {}) {
    const res = await this.#exec('PowerOffVM_Task', { _this: vmId })
    try {
      return await this.#waitForTaskEnd(this.#taskIdOf(res, 'PowerOffVM_Task'), {
        method: 'PowerOffVM_Task',
        signal,
        timeout,
      })
    } catch (error) {
      error.vmId = vmId
      warn('Fail to power off VM', { vmId, error })
      throw error
    }
  }

  async powerOn(vmId, { signal, timeout = 5 * 60e3 } = {}) {
    const res = await this.#exec('PowerOnVM_Task', { _this: vmId })
    try {
      return await this.#waitForTaskEnd(this.#taskIdOf(res, 'PowerOnVM_Task'), {
        method: 'PowerOnVM_Task',
        signal,
        timeout,
      })
    } catch (error) {
      error.vmId = vmId
      warn('Fail to power on VM', { vmId, error })
      throw error
    }
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
   */
  async reset(vmId, { signal, timeout = 5 * 60e3 } = {}) {
    const res = await this.#exec('ResetVM_Task', { _this: vmId })
    try {
      return await this.#waitForTaskEnd(this.#taskIdOf(res, 'ResetVM_Task'), {
        method: 'ResetVM_Task',
        signal,
        timeout,
      })
    } catch (error) {
      error.vmId = vmId
      warn('Fail to reset VM', { vmId, error })
      throw error
    }
  }

  /**
   * Removes every snapshot of a VM, consolidating their content into the base disks.
   *
   * @param {string} vmId - id of the VM
   */
  async removeAllSnapshots(vmId, { signal, timeout = 6 * 3600e3 } = {}) {
    const res = await this.#exec('RemoveAllSnapshots_Task', { _this: vmId, consolidate: true })
    try {
      return await this.#waitForTaskEnd(this.#taskIdOf(res, 'RemoveAllSnapshots_Task'), {
        method: 'RemoveAllSnapshots_Task',
        signal,
        // consolidating the deltas of a large disk takes as long as it takes
        timeout,
      })
    } catch (error) {
      error.vmId = vmId
      warn('Fail to remove the snapshots of VM', { vmId, error })
      throw error
    }
  }

  async snapshot(vmId, name, description, { signal, timeout = 30 * 60e3 } = {}) {
    const res = await this.#exec('CreateSnapshotEx_Task', { _this: vmId, name, description, memory: false })
    try {
      return await this.#waitForTaskEnd(this.#taskIdOf(res, 'CreateSnapshotEx_Task'), {
        method: 'CreateSnapshotEx_Task',
        signal,
        timeout,
      })
    } catch (error) {
      error.vmId = vmId
      warn('Fail to take a snapshot', { vmId, error })
      throw error
    }
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

    const result = await this.#exec(
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
      await this.#exec('CancelRetrievePropertiesEx', { _this: propertyCollector, token: returnval.token }).catch(
        error => warn('failed to cancel the property retrieval', { error, token: returnval.token })
      )
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
   * get the thumbprint of the certificate on the esxi. Extracted from vddk-remote code
   * @returns {Promise<string>}
   */
  async #getServerThumbprint() {
    const tmpDir = await fs.mkdtemp(join(tmpdir(), 'xo-server'))
    const certFile = join(tmpDir, 'cert')

    try {
      const devnull = await fs.open('/dev/null')
      // ensure arguments are properly escaped
      const cert = await new Promise((resolve, reject) => {
        const process = spawn('openssl', ['s_client', '-connect', `${this.#host}:443`])
        let cert = ''
        let stderr = ''
        devnull.createReadStream().pipe(process.stdin)
        process.stdout.on('data', data => {
          cert += data
        })

        process.stderr.on('data', data => {
          stderr += data
        })

        process.on('close', code => {
          if (code !== 0) {
            reject(new Error(`cert got an error code ${code} ${stderr}`))
          } else {
            resolve(cert)
          }
        })
      })
      await fs.writeFile(certFile, cert)
      const sha = await new Promise((resolve, reject) => {
        exec(`openssl x509 -in ${certFile} -fingerprint -sha1 -noout`, (err, stdout, stderr) => {
          if (err) {
            return reject(err)
          }
          if (stdout) {
            const matches = stdout.match(/sha1 Fingerprint=([0-9A-F:]+)/i)
            if (matches === null) {
              throw new Error(`Can't extract server finger print`, { stdout, stderr, cert })
            }
            return resolve(matches[1])
          }
          reject(new Error(`no answer in handling server thumbprint `))
        })
      })
      return sha
    } finally {
      await fs.unlink(certFile).catch(() => {})
    }
  }

  async spawnNbdKitProcess(vmId, diskPath, { singleLink = false, threads = 1, compression = 'fastlz' } = {}) {
    const key = `${vmId}/${diskPath}/${singleLink}`
    if (!this.#nbdServers.has(key)) {
      const thumbprint = await this.#getServerThumbprint()
      const port = nbdPort++
      const tmpDir = await fs.mkdtemp(join(tmpdir(), 'xo-server'))
      const passFile = join(tmpDir, 'params')
      const outFd = await fs.open(join(tmpDir, 'stdout'), 'a')
      const outFile = outFd.createWriteStream()
      const errFd = await fs.open(join(tmpDir, 'stderr'), 'a')
      const errFile = errFd.createWriteStream()
      await fs.writeFile(passFile, this.#password)
      const args = [
        '-r', // readonly
        '-v',
        '-f',
        '--exit-with-parent', // implies -f , ensure we don't leave orphans
        `--threads=${threads}`,
        `--port=${port}`,
        'vddk', // the vddk plugin
        `compression=${compression}`,
        `thumbprint=${thumbprint}`,
        `server=${this.#host}`,
        `user=${this.#user}`,
        `password=+${passFile}`,
        `libdir=${VDDK_LIB_PATH}`,
        `vm=moref=${vmId}`,
        singleLink ? 'single-link=true' : '',
        diskPath,
      ]
      try {
        const nbdKitProcess = spawn('nbdkit', args, {
          cwd: tmpDir,
          env: {
            ...process.env,
            LD_LIBRARY_PATH: `${VDDK_LIB_PATH}/lib64`,
          },
        })
        nbdKitProcess.stdout.pipe(outFile)
        nbdKitProcess.stderr.pipe(errFile)
        this.#nbdServers.set(key, {
          process: nbdKitProcess,
          nbdInfos: { address: '127.0.0.1', port, exportname: diskPath },
        })

        info(`nbdkit logs of ${diskPath} are in ${tmpDir}`)

        nbdKitProcess.on('close', code => {
          if (code !== 0) {
            warn(`nbdkit server process exited with code ${code} ,detailed logs are in ${tmpDir}/stderr `)
          }
        })
        // @todo find a better to wait for server ready
        await new Promise(resolve => setTimeout(resolve, 2000))
      } finally {
        fs.unlink(passFile).catch(warn)
      }
    }
    return this.#nbdServers.get(key)
  }
  async killNbdServer(vmId, diskPath, { singleLink = false } = {}) {
    const key = `${vmId}/${diskPath}/${singleLink}`
    if (!this.#nbdServers.has(key)) {
      warn(` process ${vmId}/${diskPath}/${singleLink} was already killed`)
    } else {
      this.#nbdServers.get(key).process.kill()
    }
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
      await nbdClient.disconnect()
      await this.killNbdServer(vmId, `[${datastoreName}] ${diskPath}`, { singleLink: true }).catch(err =>
        warn('error while stopping nbdkit server for the snapshot', err)
      )
    }
  }

  async #getDataMapFromCowd(datastoreName, diskPath, signal) {
    const descriptorResponse = await this.download(datastoreName, diskPath, { range: '0-512', signal })
    const descriptorBlob = await new Response(descriptorResponse.body).blob()
    const descriptorBytes = new Uint8Array(await descriptorBlob.arrayBuffer()).slice(0, 512)

    const parsedDescriptor = parseVmdk(new TextDecoder('utf-8').decode(descriptorBytes))

    const diskPathArray = diskPath.split('/')
    const extentPath = diskPathArray.slice(0, -1).join('/') + '/' + parsedDescriptor.fileName

    const extentHeaderResponse = await this.download(datastoreName, extentPath, { range: `0-2048`, signal })
    const extentHeaderBlob = await new Response(extentHeaderResponse.body).blob()
    const extentHeaderBuffer = Buffer.from(await extentHeaderBlob.arrayBuffer())

    strictEqual(extentHeaderBuffer.subarray(0, 4).toString('ascii'), 'COWD')

    const extentNumGdEntries = extentHeaderBuffer.readUInt32LE(24)

    const extentGDResponse = await this.download(datastoreName, extentPath, {
      range: `2048-${2048 + extentNumGdEntries * 4}`,
      signal,
    })
    const extentGDBlob = await new Response(extentGDResponse.body).blob()
    const extentGDBuffer = Buffer.from(await extentGDBlob.arrayBuffer())

    const dataMap = []
    let offset = 0
    for (let i = 0; i < extentNumGdEntries; i++) {
      const extentGDE = extentGDBuffer.readUInt32LE(i * 4)
      if (extentGDE !== 0) {
        dataMap.push({
          offset,
          length: 4096 * 512,
          type: 0,
        })
      }

      // Number of grains in a grain table * size of a grain.
      offset += 4096 * 512
    }

    return dataMap
  }

  async getDataMap(vmId, datastoreName, diskPath, signal) {
    try {
      // We await the result of getDataMapFromVddk so we can catch errors and fallback to the direct metadata reading.
      return await this.#getDataMapFromVddk(vmId, datastoreName, diskPath, signal)
    } catch (error) {
      signal?.throwIfAborted()
      warn('error while getting datamap from vddk, fall back to a direct metadata reading', error)
      return this.#getDataMapFromCowd(datastoreName, diskPath, signal)
    }
  }
}
