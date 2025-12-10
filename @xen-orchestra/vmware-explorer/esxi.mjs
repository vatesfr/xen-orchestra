import { Client } from '@vates/node-vsphere-soap'
import { createLogger } from '@xen-orchestra/log'
import { dirname, join } from 'node:path'
import { EventEmitter } from 'node:events'
import { strictEqual, notStrictEqual } from 'node:assert'
import { Agent } from 'undici'

import parseVmdk from './parsers/vmdk.mjs'
import parseVmsd from './parsers/vmsd.mjs'
import parseVmx from './parsers/vmx.mjs'
import xml2js from 'xml2js'
import { exec, spawn } from 'node:child_process'
import NbdClient from '@vates/nbd-client'

import { tmpdir } from 'node:os'
import fs from 'node:fs/promises'

const { info, warn } = createLogger('xo:vmware-explorer:esxi')

export const VDDK_LIB_DIR = '/usr/local/lib/vddk'
export const VDDK_LIB_PATH = `${VDDK_LIB_DIR}/vmware-vix-disklib-distrib`
let nbdPort = 11000
export default class Esxi extends EventEmitter {
  #client
  #cookies
  #dcPaths // map datastore name => datacenter name
  #host
  #httpsAgent
  #user
  #password
  #ready = false
  #nbdServers = new Map()

  constructor(host, user, password, sslVerify) {
    super()
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
    try {
      notStrictEqual(this.#dcPaths, undefined)
      notStrictEqual(this.#dcPaths[dataStore], undefined)
    } catch (error) {
      warn("can't find datacenter for datastore", { datacenters: this.#dcPaths, dataStore })
      throw error
    }
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
      dispatcher: this.#httpsAgent,
      method: 'GET',
      headers,
      highWaterMark: 10 * 1024 * 1024,
    })
    if (res.status < 200 || res.status >= 300) {
      const error = new Error(res.status + ' ' + res.statusText + ' ' + url)
      error.cause = res
      throw error
    }
    if (res.headers['set-cookie']) {
      this.#cookies = res.headers['set-cookie'].map(cookie => cookie.split(';')[0]).join('; ')
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
      disks,
      networks,
      vmId,
    }
  }

  async powerOff(vmId) {
    const res = await this.#exec('PowerOffVM_Task', { _this: vmId })
    const taskId = res.returnval.$value
    let state = 'running'
    let info
    for (let i = 0; i < 60; i++) {
      // https://developer.vmware.com/apis/1720/
      info = await this.fetchProperty('Task', taskId, 'info')
      state = info.state[0]
      if (state === 'success') {
        break
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
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
      dispatcher: this.#httpsAgent,
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

  async spanwNbdKitProcess(vmId, diskPath, { singleLink = false, threads = 1, compression = 'fastlz' } = {}) {
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

  async #getDataMapFromVddk(vmId, datastoreName, diskPath) {
    let nbdClient
    try {
      const start = Date.now()

      const nbdInfoSpawn = await this.spanwNbdKitProcess(vmId, `[${datastoreName}] ${diskPath}`, {
        singleLink: true,
      })

      info(`nbd server for data map spawned`)

      nbdClient = new NbdClient(nbdInfoSpawn.nbdInfos)

      await nbdClient.connect()

      info(`nbd client for data map connected`)

      const dataMap = await nbdClient.getMap()

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

  async #getDataMapFromCowd(datastoreName, diskPath) {
    const descriptorResponse = await this.download(datastoreName, diskPath, '0-512')
    const descriptorBlob = await new Response(descriptorResponse.body).blob()
    const descriptorBytes = new Uint8Array(await descriptorBlob.arrayBuffer()).slice(0, 512)

    const parsedDescriptor = parseVmdk(new TextDecoder('utf-8').decode(descriptorBytes))

    const diskPathArray = diskPath.split('/')
    const extentPath = diskPathArray.slice(0, -1).join('/') + '/' + parsedDescriptor.fileName

    const extentHeaderResponse = await this.download(datastoreName, extentPath, `0-2048`)
    const extentHeaderBlob = await new Response(extentHeaderResponse.body).blob()
    const extentHeaderBuffer = Buffer.from(await extentHeaderBlob.arrayBuffer())

    strictEqual(extentHeaderBuffer.subarray(0, 4).toString('ascii'), 'COWD')

    const extentNumGdEntries = extentHeaderBuffer.readUInt32LE(24)

    const extentGDResponse = await this.download(datastoreName, extentPath, `2048-${2048 + extentNumGdEntries * 4}`)
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

  async getDataMap(vmId, datastoreName, diskPath) {
    try {
      // We await the result of getDataMapFromVddk so we can catch errors and fallback to the direct metadata reading.
      return await this.#getDataMapFromVddk(vmId, datastoreName, diskPath)
    } catch (error) {
      warn('error while getting datamap from vddk, fall back to a direct metadata reading', error)
      return this.#getDataMapFromCowd(datastoreName, diskPath)
    }
  }
}
