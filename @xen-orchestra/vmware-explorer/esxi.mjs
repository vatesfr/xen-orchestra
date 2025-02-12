import { Client } from '@vates/node-vsphere-soap'
import { createLogger } from '@xen-orchestra/log'
import { dirname } from 'node:path'
import { EventEmitter } from 'node:events'
import { strictEqual, notStrictEqual } from 'node:assert'
import fetch from 'node-fetch'
import https from 'https'

import parseVmdk from './parsers/vmdk.mjs'
import parseVmsd from './parsers/vmsd.mjs'
import parseVmx from './parsers/vmx.mjs'
import xml2js from 'xml2js'

const { warn } = createLogger('xo:vmware-explorer:esxi')

export default class Esxi extends EventEmitter {
  #client
  #cookies
  #dcPaths // map datastore name => datacenter name
  #host
  #httpsAgent
  #user
  #password
  #ready = false

  constructor(host, user, password, sslVerify) {
    super()
    this.#host = host.trim()
    this.#user = user
    this.#password = password
    if (!sslVerify) {
      this.#httpsAgent = new https.Agent({
        rejectUnauthorized: false,
      })
    }

    this.#client = new Client(host, user, password, sslVerify)
    this.#client.once('ready', async () => {
      try {
        // this.#ready is set to true to allow the this.search query to go through
        // this means that the server is connected and can answer API queries
        // you won't be able to download a file as long a the 'ready' event is not emitted
        this.#ready = true
        await this.#computeDatacenters()
        this.emit('ready')
      } catch (error) {
        this.emit('error', error)
      }
    })
    this.#client.on('error', err => {
      this.emit('error', err)
    })
  }

  async #computeDatacenters() {
    this.#dcPaths = {}
    // the datastore property is a collection of datastore id
    const res = await this.search('Datacenter', ['name', 'datastore'])
    await Promise.all(
      Object.values(res).map(async ({ datastore, name }) => {
        if (datastore.ManagedObjectReference === undefined) {
          return
        }
        await Promise.all(
          datastore.ManagedObjectReference.map(async ({ $value }) => {
            // get the datastore name
            const res = await this.fetchProperty('Datastore', $value, 'name')
            this.#dcPaths[res._] = name
          })
        )
      })
    )
  }

  #findDatacenter(dataStore) {
    notStrictEqual(this.#dcPaths, undefined)
    notStrictEqual(this.#dcPaths[dataStore], undefined)
    return this.#dcPaths[dataStore]
  }

  #exec(cmd, args) {
    strictEqual(this.#ready, true)
    const client = this.#client
    return new Promise(function (resolve, reject) {
      client.once('error', function (error) {
        client.off('result', resolve)
        reject(error)
      })
      client.runCommand(cmd, args).once('result', function () {
        client.off('error', reject)
        resolve(...arguments)
      })
    })
  }

  async #fetch(url, headers = {}) {
    if (this.#cookies) {
      headers.cookie = this.#cookies
    } else {
      headers.Authorization = 'Basic ' + Buffer.from(this.#user + ':' + this.#password).toString('base64')
    }
    const res = await fetch(url, {
      agent: this.#httpsAgent,
      method: 'GET',
      headers,
      highWaterMark: 10 * 1024 * 1024,
    })
    if (res.status < 200 || res.status >= 300) {
      const error = new Error(res.status + ' ' + res.statusText + ' ' + url)
      error.cause = res
      throw error
    }
    if (res.headers.raw()['set-cookie']) {
      this.#cookies = res.headers
        .raw()
        ['set-cookie'].map(cookie => cookie.split(';')[0])
        .join('; ')
    }
    return res
  }

  async #download(dataStore, path, range) {
    strictEqual(this.#ready, true)
    const url = new URL('https://localhost')
    url.host = this.#host
    url.pathname = '/folder/' + path
    url.searchParams.set('dcPath', this.#findDatacenter(dataStore))
    url.searchParams.set('dsName', dataStore)
    const headers = {}
    if (range) {
      headers['content-type'] = 'multipart/byteranges'
      headers.Range = 'bytes=' + range
    }
    return this.#fetch(url, headers)
  }

  async download(dataStore, path, range) {
    let tries = 5
    let lastError
    while (tries > 0) {
      try {
        const res = await this.#download(dataStore, path, range)
        return res
      } catch (error) {
        warn('got error , will retry in 2 seconds', { error })
        lastError = error
      }
      await new Promise(resolve => setTimeout(() => resolve(), 2000))
      tries--
    }

    throw lastError
  }

  // inspired from https://github.com/reedog117/node-vsphere-soap/blob/master/test/vsphere-soap.test.js#L95
  async search(type, properties) {
    // search types are limited to "ComputeResource", "Datacenter", "Datastore", "DistributedVirtualSwitch", "Folder", "HostSystem", "Network", "ResourcePool", "VirtualMachine"}
    // from https://github.com/vmware/govmomi/issues/2595#issuecomment-966604502
    // get property collector
    const propertyCollector = this.#client.serviceContent.propertyCollector
    // get view manager
    const viewManager = this.#client.serviceContent.viewManager
    // get root folder
    const rootFolder = this.#client.serviceContent.rootFolder
    let result = await this.#exec('CreateContainerView', {
      _this: viewManager,
      container: rootFolder,
      type: [type],
      recursive: true,
    })

    // build all the data structures needed to query all the vm names
    const containerView = result.returnval

    const objectSpec = {
      attributes: { 'xsi:type': 'ObjectSpec' }, // setting attributes xsi:type is important or else the server may mis-recognize types!
      obj: containerView,
      skip: true,
      selectSet: [
        {
          attributes: { 'xsi:type': 'TraversalSpec' },
          name: 'traverseEntities',
          type: 'ContainerView',
          path: 'view',
          skip: false,
        },
      ],
    }

    const propertyFilterSpec = {
      attributes: { 'xsi:type': 'PropertyFilterSpec' },
      propSet: properties.map(p => ({
        attributes: { 'xsi:type': 'PropertySpec' },
        type,
        pathSet: [p],
      })),
      objectSet: [objectSpec],
    }

    let token
    const objects = {}
    do {
      if (token !== undefined) {
        result = await this.#exec('ContinueRetrievePropertiesEx', {
          _this: propertyCollector,
          token,
        })
      } else {
        result = await this.#exec('RetrievePropertiesEx', {
          _this: propertyCollector,
          specSet: [propertyFilterSpec],
          options: { attributes: { type: 'RetrieveOptions' } },
        })
      }

      const returnObj = Array.isArray(result.returnval.objects) ? result.returnval.objects : [result.returnval.objects]
      returnObj.forEach(({ obj, propSet }) => {
        objects[obj.$value] = {}
        propSet = Array.isArray(propSet) ? propSet : [propSet]
        propSet.forEach(({ name, val }) => {
          // don't care about the type for now
          delete val.attributes
          // a scalar value : simplify it
          if (val.$value) {
            objects[obj.$value][name] = val.$value
          } else {
            objects[obj.$value][name] = val
          }
        })
      })

      token = result.returnval.token
    } while (token)

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
      descriptionLabel: ' from esxi',
    }
  }

  async getAllVmMetadata() {
    const datas = await this.search('VirtualMachine', ['config', 'storage', 'runtime', 'layoutEx'])

    return Object.keys(datas)
      .map(id => {
        const { config, layoutEx, storage, runtime } = datas[id]
        if (storage === undefined) {
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

    for (const key of Object.keys(vmx)) {
      const matches = key.match(/^(scsi|ide|ethernet)[0-9]+$/)
      if (matches === null) {
        continue
      }
      const channelType = matches[1]
      if (channelType === 'ide' || channelType === 'scsi') {
        const diskChannel = vmx[key]
        for (const diskIndex in Object.values(diskChannel)) {
          const disk = diskChannel[diskIndex]
          if (typeof disk !== 'object') {
            continue
          }
          if (disk.deviceType?.match(/cdrom/i)) {
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
      // no vmsd file :fall back to a full withou snapshots
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
      disks,
      networks,
    }
  }

  async powerOff(vmId) {
    const res = await this.#exec('PowerOffVM_Task', { _this: vmId })
    const taskId = res.returnval.$value
    let state = 'running'
    let info
    for (let i = 0; i < 60 && state === 'running'; i++) {
      // https://developer.vmware.com/apis/1720/
      info = await this.fetchProperty('Task', taskId, 'info')
      state = info.state[0]
      if (state === 'running') {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    strictEqual(state, 'success', info.error ?? `fail to power off vm ${vmId}, state:${state}`)
    return info
  }
  powerOn(vmId) {
    return this.#exec('PowerOnVM_Task', { _this: vmId })
  }
  async fetchProperty(type, id, propertyName) {
    // the fetch method does not seems to be exposed by the wsdl
    // inspired by the pyvmomi implementation ( StubAdapterAccessorImpl.py / InvokeAccessor)
    const url = new URL('https://localhost/sdk')
    url.host = this.#host
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Cookie: this.#client.authCookie.cookies,
        SOAPAction: '"urn:vim25/6.0"', // mandatory to have an answer when asking for httpNfcLease
      },
      agent: this.#httpsAgent,
      body: `<?xml version="1.0" encoding="UTF-8"?>
        <soapenv:Envelope 
          xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/" 
          xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
          xmlns:xsd="http://www.w3.org/2001/XMLSchema"
        >
          <soapenv:Body>
            <Fetch xmlns="urn:vim25">
              <_this type="${type}">${id}</_this>
              <prop >${propertyName}</prop>
            </Fetch>
          </soapenv:Body>
        </soapenv:Envelope>`,
    })
    const text = await res.text()
    const matches = text.match(/<FetchResponse[^>]*>(.*)<\/FetchResponse>/s)
    if (matches === null) {
      throw new Error(`can't get ${propertyName} of object ${id} (Type: ${type})`)
    }
    return new Promise((resolve, reject) => {
      xml2js.parseString(matches[1], (err, res) => (err ? reject(err) : resolve(res.returnval)))
    })
  }

  async export(vmId) {
    const exported = await this.#exec('ExportVm', { _this: vmId })
    const exportTaskId = exported.returnval.$value
    let isReady = false
    for (let i = 0; i < 10 && !isReady; i++) {
      const state = await this.fetchProperty('HttpNfcLease', exportTaskId, 'state')
      isReady = state._ === 'ready'
      if (!isReady) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    if (!isReady) {
      throw new Error('not ready')
    }

    const { deviceUrl: deviceUrls } = await this.fetchProperty('HttpNfcLease', exportTaskId, 'info')
    const streams = {}
    for (let { url, disk, targetId } of deviceUrls) {
      url = url[0]
      disk = disk[0]
      // filter ram/cdrom/..
      if (disk === 'true') {
        const fullUrl = new URL(url)
        if (url.indexOf('/*/') > 0) {
          // the url returned can be in the form of https://*/ followed by a short-lived link, default 5mn
          // in this case, use the vsphere ip/name
          fullUrl.host = this.#host
        }
        const vmdkres = await this.#fetch(fullUrl)
        const stream = vmdkres.body
        streams[targetId] = stream
      }
    }

    return streams
  }
}
