import { Client } from 'node-vsphere-soap'
import { dirname } from 'node:path'
import { EventEmitter } from 'node:events'
import { strictEqual } from 'node:assert'
import fetch from 'node-fetch'

import parseVmdk from './parsers/vmdk.mjs'
import parseVmsd from './parsers/vmsd.mjs'
import parseVmx from './parsers/vmx.mjs'
import VhdCowd from './VhdEsxiCowd.mjs'
import VhdEsxiRaw from './VhdEsxiRaw.mjs'

const MAX_SCSI = 9
const MAX_ETHERNET = 9

export default class Esxi extends EventEmitter {
  #client
  #cookies
  #host
  #user
  #password
  #ready = false

  constructor(host, user, password, sslVerify = true) {
    super()
    this.#host = host
    this.#user = user
    this.#password = password
    this.#client = new Client(host, user, password, sslVerify)
    process.on('warning', this.#eatTlsWarning )
    this.#client.once('ready', () => {
      process.off('warning', this.#eatTlsWarning )
      this.#ready = true
      this.emit('ready')
    })
    this.#client.on('error', err => {
      process.off('warning', this.#eatTlsWarning )
      console.error({
        in:'ERROR',
        code: err.code,
        message: err.message
      })
      this.emit('error', err)
    })
  }

  #eatTlsWarning (/* err */){
     // console.log('yummy', err.code, err.message)
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

  async download(dataStore, path, range) {
    strictEqual(this.#ready, true)
    const url = `https://${this.#host}/folder/${path}?dsName=${dataStore}`
    const headers = {}
    if(this.#cookies){
      headers.cookie= this.#cookies
    } else {
      headers.Authorization = 'Basic ' + Buffer.from(this.#user + ':' + this.#password).toString('base64')
    }
    if (range) {
      headers['content-type'] = 'multipart/byteranges'
      headers.Range = 'bytes=' + range
    }
    const res = await fetch(url, {
      method: 'GET',
      headers,
      highWaterMark: 10 * 1024 * 1024,
    })
    if (res.status < 200 || res.status >= 300) {
      const error = new Error(res.status + ' ' + res.statusText + ' ' + url)
      error.cause = res
      throw error
    }
    if(res.headers.raw()['set-cookie']){
      this.#cookies = res.headers.raw()['set-cookie']
    }
    return res
  }

  async search(type, properties) {
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

    result = await this.#exec('RetrievePropertiesEx', {
      _this: propertyCollector,
      specSet: [propertyFilterSpec],
      options: { attributes: { type: 'RetrieveOptions' } },
    })

    const objects = {}
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
    const { fileName, parentFileName, capacity } = parsed

    return {
      ...parsed,
      datastore: diskDataStore,
      path: dirname(diskPath),
      descriptionLabel: ' from esxi',
      vhd: async () => {
        if (fileName.endsWith('-flat.vmdk')) {
          const vhd = await VhdEsxiRaw.open(this, diskDataStore, dirname(diskPath) + '/' + fileName)
          await vhd.readBlockAllocationTable()
          return vhd.stream()
        }
        // last snasphot only works when vm is powered off
        const vhd = await VhdCowd.open(this, diskDataStore, dirname(diskPath) + '/' + fileName, parentFileName)
        await vhd.readBlockAllocationTable()

        return vhd.stream()
      },
      rawStream: async () => {
        if (!fileName.endsWith('-flat.vmdk')) {
          return
        }

        // @todo : only if vm is powered off
        const stream = (await this.download(diskDataStore, dirname(diskPath) + '/' + fileName)).body
        stream.length = capacity
        return stream
      },
    }
  }

  async getTransferableVmMetadata(vmId) {
    const search = await this.search('VirtualMachine', ['name', 'config', 'storage', 'runtime', 'snapshot'])
    if (search[vmId] === undefined) {
      throw new Error(`VM ${vmId} not found `)
    }
    const { config, runtime } = search[vmId]

    const [, dataStore, vmxPath] = config.files.vmPathName.match(/^\[(.*)\] (.+.vmx)$/)
    const res = await this.download(dataStore, vmxPath)

    const vmx = parseVmx(await res.text())

    // list datastores
    const dataStores = {}
    Object.values(await this.search('Datastore', ['summary'])).forEach(({ summary }) => {
      dataStores[summary.url] = summary
    })

    const disks = []

    for (let scsiIndex = 0; scsiIndex < MAX_SCSI; scsiIndex++) {
      const scsiChannel = vmx[`scsi${scsiIndex}`]
      if (scsiChannel === undefined) {
        continue
      }
      for (const diskIndex in Object.values(scsiChannel)) {
        const disk = scsiChannel[diskIndex]
        if (typeof disk !== 'object' || disk.deviceType !== 'scsi-hardDisk') {
          continue
        }
        disks.push({
          ...(await this.#inspectVmdk(dataStores, dataStore, dirname(vmxPath), disk.fileName)),
          node: `scsi${scsiIndex}:${diskIndex}`,
        })
      }
    }
    const networks = []
    for (let ethernetIndex = 0; ethernetIndex < MAX_ETHERNET; ethernetIndex++) {
      const ethernet = vmx[`ethernet${ethernetIndex}`]
      if (ethernet === undefined) {
        continue
      }
      networks.push({
        label: ethernet.networkName,
        macAddress: ethernet.generatedAddress,
        isGenerated: ethernet.addressType === 'generated',
      })
    }
    const vmsd = await (await this.download(dataStore, vmxPath.replace('.vmx', '.vmsd'))).text()
    let snapshots
    if(vmsd){
      snapshots = parseVmsd(vmsd)

      for (const snapshotIndex in snapshots?.snapshots) {
        const snapshot = snapshots.snapshots[snapshotIndex]
        for (const diskIndex in snapshot.disks) {
          const fileName = snapshot.disks[diskIndex].fileName
          snapshot.disks[diskIndex] = {
            node: snapshot.disks[diskIndex]?.node, // 'scsi0:0',
            ...(await this.#inspectVmdk(dataStores, dataStore, dirname(vmxPath), fileName)),
          }
        }
      }
    }

    return {
      name_label: config.name,
      memory: parseInt(config.hardware.memoryMB) * 1024 * 1024,
      numCpu: parseInt(config.hardware.numCPU),
      guestToolsInstalled: false,
      firmware: config.firmware, // bios or uefi
      powerState: runtime.powerState,
      snapshots,
      disks,
      networks,
    }
  }
}
