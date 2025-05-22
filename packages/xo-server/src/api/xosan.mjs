import assert from 'assert'
import asyncMapSettled from '@xen-orchestra/async-map/legacy.js'
import { execa } from 'execa'
import filter from 'lodash/filter.js'
import find from 'lodash/find.js'
import fs from 'fs-extra'
import includes from 'lodash/includes.js'
import map from 'lodash/map.js'
import range from 'lodash/range.js'
import remove from 'lodash/remove.js'
import { createLogger } from '@xen-orchestra/log'
import { defer } from 'golike-defer'
import { tap, delay } from 'promise-toolbox'
import { invalidParameters } from 'xo-common/api-errors.js'
import { Ref } from 'xen-api'

import ensureArray from '../_ensureArray.mjs'
import { parseXml } from '../utils.mjs'

const log = createLogger('xo:xosan')

const SSH_KEY_FILE = 'id_rsa_xosan'
const DEFAULT_NETWORK_PREFIX = '172.31.100.'
const VM_FIRST_NUMBER = 101
const HOST_FIRST_NUMBER = 1
const GIGABYTE = 1024 * 1024 * 1024
const XOSAN_VM_SYSTEM_DISK_SIZE = 10 * GIGABYTE
const XOSAN_DATA_DISK_USAGE_RATIO = 0.99
const XOSAN_LICENSE_QUOTA = 200 * GIGABYTE

const CURRENT_POOL_OPERATIONS = {}

function getXosanConfig(xosansr, xapi = this.getXapi(xosansr)) {
  const data = xapi.xo.getData(xosansr, 'xosan_config')
  if (data && data.networkPrefix === undefined) {
    // some xosan might have been created before this field was added
    data.networkPrefix = DEFAULT_NETWORK_PREFIX
    // fire and forget
    xapi.xo.setData(xosansr, 'xosan_config', data)
  }
  return data
}

function _getIPToVMDict(xapi, sr) {
  const dict = {}
  const data = getXosanConfig(sr, xapi)
  if (data && data.nodes) {
    data.nodes.forEach(conf => {
      try {
        dict[conf.brickName] = {
          vm: xapi.getObject(conf.vm.id),
          sr: conf.underlyingSr,
        }
      } catch (e) {
        // pass
      }
    })
  }
  return dict
}

function _getGlusterEndpoint(sr) {
  const xapi = this.getXapi(sr)
  const data = getXosanConfig(sr, xapi)
  if (!data || !data.nodes) {
    return null
  }
  return {
    xapi,
    data,
    hosts: map(data.nodes, node => xapi.getObject(node.host)),
    addresses: map(data.nodes, node => node.vm.ip),
  }
}

async function rateLimitedRetry(action, shouldRetry, retryCount = 20) {
  let retryDelay = 500 * (1 + Math.random() / 20)
  let result
  while (retryCount > 0 && (result = await action()) && shouldRetry(result)) {
    retryDelay *= 1.1
    log.debug(`waiting ${retryDelay} ms and retrying`)
    await delay(retryDelay)
    retryCount--
  }
  return result
}

function createVolumeInfoTypes() {
  function parseHeal(parsed) {
    const bricks = []
    parsed.healInfo.bricks.brick.forEach(brick => {
      bricks.push(brick)
      if (brick.file) {
        brick.file = ensureArray(brick.file)
      }
    })
    return { commandStatus: true, result: { bricks } }
  }

  function parseStatus(parsed) {
    const brickDictByUuid = {}
    const volume = parsed.volStatus.volumes.volume
    volume.node.forEach(node => {
      brickDictByUuid[node.peerid] = brickDictByUuid[node.peerid] || []
      brickDictByUuid[node.peerid].push(node)
    })
    return {
      commandStatus: true,
      result: { nodes: brickDictByUuid, tasks: volume.tasks },
    }
  }

  async function parseInfo(parsed) {
    const volume = parsed.volInfo.volumes.volume
    volume.bricks = volume.bricks.brick
    volume.options = volume.options.option
    return { commandStatus: true, result: volume }
  }

  const sshInfoType = (command, handler) => {
    return async function (sr) {
      const glusterEndpoint = this::_getGlusterEndpoint(sr)
      const cmdShouldRetry = result =>
        !result.commandStatus &&
        ((result.parsed && result.parsed.cliOutput.opErrno === '30802') ||
          result.stderr.match(/Another transaction is in progress/))
      const runCmd = async () => glusterCmd(glusterEndpoint, 'volume ' + command, true)
      const commandResult = await rateLimitedRetry(runCmd, cmdShouldRetry, 30)
      return commandResult.commandStatus ? this::handler(commandResult.parsed.cliOutput, sr) : commandResult
    }
  }

  async function profileType(sr) {
    async function parseProfile(parsed) {
      const volume = parsed.volProfile
      volume.bricks = ensureArray(volume.brick)
      delete volume.brick
      return { commandStatus: true, result: volume }
    }

    return this::sshInfoType('profile xosan info', parseProfile)(sr)
  }

  async function profileTopType(sr) {
    async function parseTop(parsed) {
      const volume = parsed.volTop
      volume.bricks = ensureArray(volume.brick)
      delete volume.brick
      return { commandStatus: true, result: volume }
    }

    const topTypes = ['open', 'read', 'write', 'opendir', 'readdir']
    return asyncMapSettled(topTypes, async type => ({
      type,
      result: await this::sshInfoType(`top xosan ${type}`, parseTop)(sr),
    }))
  }

  function checkHosts(sr) {
    const xapi = this.getXapi(sr)
    const data = getXosanConfig(sr, xapi)
    const network = xapi.getObject(data.network)
    const badPifs = filter(network.$PIFs, pif => pif.ip_configuration_mode !== 'Static')
    return badPifs.map(pif => ({ pif, host: pif.$host.$id }))
  }

  return {
    heal: sshInfoType('heal xosan info', parseHeal),
    status: sshInfoType('status xosan', parseStatus),
    statusDetail: sshInfoType('status xosan detail', parseStatus),
    statusMem: sshInfoType('status xosan mem', parseStatus),
    info: sshInfoType('info xosan', parseInfo),
    profile: profileType,
    profileTop: profileTopType,
    hosts: checkHosts,
  }
}

const VOLUME_INFO_TYPES = createVolumeInfoTypes()

export async function getVolumeInfo({ sr, infoType }) {
  await this.checkXosanLicense({ srId: sr.uuid })

  const glusterEndpoint = this::_getGlusterEndpoint(sr)

  if (glusterEndpoint == null) {
    return null
  }
  const foundType = VOLUME_INFO_TYPES[infoType]
  if (!foundType) {
    throw new Error('getVolumeInfo(): "' + infoType + '" is an invalid type')
  }
  return this::foundType(sr)
}

getVolumeInfo.description = 'info on gluster volume'
getVolumeInfo.permission = 'admin'

getVolumeInfo.params = {
  sr: {
    type: 'string',
  },
  infoType: {
    enum: Object.keys(VOLUME_INFO_TYPES),
  },
}
getVolumeInfo.resolve = {
  sr: ['sr', 'SR', 'administrate'],
}

export async function profileStatus({ sr, changeStatus = null }) {
  await this.checkXosanLicense({ srId: sr.uuid })

  const glusterEndpoint = this::_getGlusterEndpoint(sr)
  if (changeStatus === false) {
    await glusterCmd(glusterEndpoint, 'volume profile xosan stop')
    return null
  }
  if (changeStatus === true) {
    await glusterCmd(glusterEndpoint, 'volume profile xosan start')
  }
  return this::getVolumeInfo({ sr, infoType: 'profile' })
}

profileStatus.description = 'activate, deactivate, or interrogate profile data'
profileStatus.permission = 'admin'
profileStatus.params = {
  sr: {
    type: 'string',
  },
  changeStatus: {
    type: 'boolean',
    optional: true,
  },
}
profileStatus.resolve = {
  sr: ['sr', 'SR', 'administrate'],
}

function reconfigurePifIP(xapi, pif, newIP) {
  xapi.call('PIF.reconfigure_ip', pif.$ref, 'Static', newIP, '255.255.255.0', '', '')
}

// this function should probably become fixSomething(thingToFix, params)
export async function fixHostNotInNetwork({ xosanSr, host }) {
  await this.checkXosanLicense({ srId: xosanSr.uuid })

  const xapi = this.getXapi(xosanSr)
  const data = getXosanConfig(xosanSr, xapi)
  const network = xapi.getObject(data.network)
  const usedAddresses = network.$PIFs.filter(pif => pif.ip_configuration_mode === 'Static').map(pif => pif.IP)
  const pif = network.$PIFs.find(pif => pif.ip_configuration_mode !== 'Static' && pif.$host.$id === host)
  if (pif) {
    const newIP = _findIPAddressOutsideList(usedAddresses, HOST_FIRST_NUMBER)
    reconfigurePifIP(xapi, pif, newIP)
    await xapi.callAsync('PIF.plug', pif.$ref)
    const PBD = find(xosanSr.$PBDs, pbd => pbd.$host.$id === host)
    if (PBD) {
      await xapi.callAsync('PBD.plug', PBD.$ref)
    }
    const sshKey = await getOrCreateSshKey(xapi)
    await callPlugin(xapi, host, 'receive_ssh_keys', {
      private_key: sshKey.private,
      public_key: sshKey.public,
      force: true,
    })
  }
}

fixHostNotInNetwork.description = 'put host in xosan network'
fixHostNotInNetwork.permission = 'admin'

fixHostNotInNetwork.params = {
  xosanSr: {
    type: 'string',
  },
  host: {
    type: 'string',
  },
}
fixHostNotInNetwork.resolve = {
  sr: ['sr', 'SR', 'administrate'],
}

function floor2048(value) {
  return 2048 * Math.floor(value / 2048)
}

async function copyVm(xapi, originalVm, sr) {
  return { sr, vm: await xapi.copyVm(originalVm, { srOrSrId: sr }) }
}

async function callPlugin(xapi, host, command, params) {
  log.debug(`calling plugin ${host.address} ${command}`)
  return JSON.parse(await xapi.call('host.call_plugin', host.$ref, 'xosan.py', command, params))
}

async function remoteSsh(glusterEndpoint, cmd, ignoreError = false) {
  let result
  const formatSshError = result => {
    const messageArray = []
    const messageKeys = Object.keys(result)
    const orderedKeys = ['stderr', 'stdout', 'exit']
    for (const key of orderedKeys) {
      const idx = messageKeys.indexOf(key)
      if (idx !== -1) {
        messageKeys.splice(idx, 1)
      }
      messageArray.push(`${key}: ${result[key]}`)
    }
    messageArray.push('command: ' + result.command.join(' '))
    messageKeys.splice(messageKeys.indexOf('command'), 1)
    for (const key of messageKeys) {
      messageArray.push(`${key}: ${JSON.stringify(result[key])}`)
    }
    return messageArray.join('\n')
  }

  for (const address of glusterEndpoint.addresses) {
    for (const host of glusterEndpoint.hosts) {
      try {
        result = await callPlugin(glusterEndpoint.xapi, host, 'run_ssh', {
          destination: 'root@' + address,
          cmd,
        })
        break
      } catch (exception) {
        if (exception.code !== 'HOST_OFFLINE') {
          throw exception
        }
      }
    }

    log.debug(`result of ${result.command.join(' ')}`, {
      exit: result.exit,
      err: result.stderr,
      out: result.stdout.slice(0, 1000),
    })
    // 255 seems to be ssh's own error codes.
    if (result.exit !== 255) {
      if (!ignoreError && result.exit !== 0) {
        throw new Error(formatSshError(result))
      }
      return result
    }
  }
  throw new Error(result != null ? formatSshError(result) : 'no suitable SSH host: ' + JSON.stringify(glusterEndpoint))
}

function findErrorMessage(commandResult) {
  if (commandResult.exit === 0 && commandResult.parsed) {
    const cliOut = commandResult.parsed.cliOutput
    if (cliOut.opErrstr && cliOut.opErrstr.length) {
      return cliOut.opErrstr
    }
    // "peer probe" returns it's "already in peer" error in cliOutput/output
    if (cliOut.output && cliOut.output.length) {
      return cliOut.output
    }
  }
  return commandResult.stderr.length ? commandResult.stderr : commandResult.stdout
}

async function glusterCmd(glusterEndpoint, cmd, ignoreError = false) {
  const result = await remoteSsh(glusterEndpoint, `gluster --mode=script --xml ${cmd}`, true)
  try {
    result.parsed = parseXml(result.stdout)
  } catch (e) {
    // pass, we never know if a message can be parsed or not, so we just try
  }
  if (result.exit === 0) {
    const cliOut = result.parsed.cliOutput
    // we have found cases where opErrno is !=0 and opRet was 0, albeit the operation was an error.
    result.commandStatus = cliOut.opRet.trim() === '0' && cliOut.opErrno.trim() === '0'
    result.error = findErrorMessage(result)
  } else {
    result.commandStatus = false
    // "gluster volume status" timeout error message is reported on stdout instead of stderr
    result.error = findErrorMessage(result)
  }
  if (!ignoreError && !result.commandStatus) {
    const error = new Error(`error in gluster "${result.error}"`)
    error.result = result
    throw error
  }
  return result
}

const createNetworkAndInsertHosts = defer(async function ($defer, xapi, pif, vlan, networkPrefix) {
  let hostIpLastNumber = HOST_FIRST_NUMBER
  const xosanNetwork = await xapi.createNetwork({
    name: 'XOSAN network',
    description: 'XOSAN network',
    pifId: pif._xapiId,
    mtu: pif.mtu,
    vlan: +vlan,
  })
  $defer.onFailure(() => xapi.deleteNetwork(xosanNetwork))
  const addresses = xosanNetwork.$PIFs.map(pif => ({
    pif,
    address: networkPrefix + hostIpLastNumber++,
  }))
  await asyncMapSettled(addresses, addressAndPif => reconfigurePifIP(xapi, addressAndPif.pif, addressAndPif.address))
  const master = xapi.pool.$master
  const otherAddresses = addresses.filter(addr => addr.pif.$host !== master)
  await asyncMapSettled(otherAddresses, async address => {
    const result = await callPlugin(xapi, master, 'run_ping', {
      address: address.address,
    })
    if (result.exit !== 0) {
      throw invalidParameters(
        `Could not ping ${master.name_label}->${address.pif.$host.name_label} (${address.address}) \n${result.stdout}`
      )
    }
  })
  return xosanNetwork
})

async function getOrCreateSshKey(xapi) {
  let sshKey = xapi.xo.getData(xapi.pool, 'xosan_ssh_key')

  if (!sshKey) {
    const readKeys = async () => {
      sshKey = {
        private: await fs.readFile(SSH_KEY_FILE, 'ascii'),
        public: await fs.readFile(SSH_KEY_FILE + '.pub', 'ascii'),
      }
      xapi.xo.setData(xapi.pool, 'xosan_ssh_key', sshKey)
    }

    try {
      await readKeys()
    } catch (e) {
      await execa('ssh-keygen', ['-q', '-f', SSH_KEY_FILE, '-t', 'rsa', '-b', '4096', '-N', ''])
      await readKeys()
    }
  }

  return sshKey
}

const _probePoolAndWaitForPresence = defer(async function ($defer, glusterEndpoint, addresses) {
  await asyncMapSettled(addresses, async address => {
    await glusterCmd(glusterEndpoint, 'peer probe ' + address)
    $defer.onFailure(() => glusterCmd(glusterEndpoint, 'peer detach ' + address, true))
  })

  function shouldRetry(peers) {
    for (const peer of peers) {
      if (peer.state === '4') {
        return true
      }
      if (peer.state === '6') {
        throw new Error(`${peer.hostname} is not in pool ("${peer.stateStr}")`)
      }
    }
    return false
  }

  const getPoolStatus = async () => (await glusterCmd(glusterEndpoint, 'pool list')).parsed.cliOutput.peerStatus.peer
  return rateLimitedRetry(getPoolStatus, shouldRetry)
})

async function configureGluster(redundancy, ipAndHosts, glusterEndpoint, glusterType, arbiter = null) {
  const configByType = {
    replica_arbiter: {
      creation: 'replica 3 arbiter 1',
      extra: [],
    },
    replica: {
      creation: 'replica ' + redundancy + ' ',
      extra: ['volume set xosan cluster.data-self-heal on'],
    },
    disperse: {
      creation: 'disperse ' + ipAndHosts.length + ' redundancy ' + redundancy + ' ',
      extra: [],
    },
  }
  const brickVms = arbiter ? ipAndHosts.concat(arbiter) : ipAndHosts
  await _probePoolAndWaitForPresence(
    glusterEndpoint,
    map(brickVms.slice(1), bv => bv.address)
  )
  const creation = configByType[glusterType].creation
  const volumeCreation =
    'volume create xosan ' + creation + ' ' + brickVms.map(ipAndHost => ipAndHost.brickName).join(' ')
  log.debug(`creating volume: ${volumeCreation}`)
  await glusterCmd(glusterEndpoint, volumeCreation)
  await glusterCmd(glusterEndpoint, 'volume set xosan network.remote-dio enable')
  await glusterCmd(glusterEndpoint, 'volume set xosan cluster.eager-lock enable')
  await glusterCmd(glusterEndpoint, 'volume set xosan cluster.locking-scheme granular')
  await glusterCmd(glusterEndpoint, 'volume set xosan performance.io-cache off')
  await glusterCmd(glusterEndpoint, 'volume set xosan performance.read-ahead off')
  await glusterCmd(glusterEndpoint, 'volume set xosan performance.quick-read off')
  await glusterCmd(glusterEndpoint, 'volume set xosan performance.strict-write-ordering off')
  await glusterCmd(glusterEndpoint, 'volume set xosan client.event-threads 8')
  await glusterCmd(glusterEndpoint, 'volume set xosan server.event-threads 8')
  await glusterCmd(glusterEndpoint, 'volume set xosan performance.io-thread-count 64')
  await glusterCmd(glusterEndpoint, 'volume set xosan performance.stat-prefetch on')
  await glusterCmd(glusterEndpoint, 'volume set xosan performance.low-prio-threads 32')
  await glusterCmd(glusterEndpoint, 'volume set xosan features.shard on')
  await glusterCmd(glusterEndpoint, 'volume set xosan features.shard-block-size 512MB')
  await glusterCmd(glusterEndpoint, 'volume set xosan user.cifs off')
  for (const confChunk of configByType[glusterType].extra) {
    await glusterCmd(glusterEndpoint, confChunk)
  }
  await glusterCmd(glusterEndpoint, 'volume start xosan')
  await _setQuota(glusterEndpoint)
}

async function _setQuota(glusterEndpoint) {
  await glusterCmd(glusterEndpoint, 'volume quota xosan enable', true)
  await glusterCmd(glusterEndpoint, 'volume set xosan quota-deem-statfs on', true)
  await glusterCmd(glusterEndpoint, `volume quota xosan limit-usage / ${XOSAN_LICENSE_QUOTA}B`, true)
}

async function _removeQuota(glusterEndpoint) {
  await glusterCmd(glusterEndpoint, 'volume quota xosan disable', true)
}

export const createSR = defer(async function (
  $defer,
  {
    template,
    pif,
    vlan,
    srs,
    glusterType,
    redundancy,
    brickSize = this::computeBrickSize(srs),
    memorySize = 4 * GIGABYTE,
    ipRange = DEFAULT_NETWORK_PREFIX + '.0',
  }
) {
  const OPERATION_OBJECT = {
    operation: 'createSr',
    states: [
      'configuringNetwork',
      'importingVm',
      'copyingVms',
      'configuringVms',
      'configuringGluster',
      'creatingSr',
      'scanningSr',
    ],
  }
  if (!this.requestResource) {
    throw new Error('requestResource is not a function')
  }

  if (srs.length < 1) {
    return // TODO: throw an error
  }

  const xapi = this.getXapi(srs[0])
  const poolId = xapi.pool.$id
  if (CURRENT_POOL_OPERATIONS[poolId]) {
    throw new Error('createSR is already running for this pool')
  }

  CURRENT_POOL_OPERATIONS[poolId] = { ...OPERATION_OBJECT, state: 0 }

  const tmpBoundObjectId = `tmp_${srs.join(',')}_${Math.random().toString(32).slice(2)}`
  const license = await this.createBoundXosanTrialLicense({
    boundObjectId: tmpBoundObjectId,
  })
  $defer.onFailure(() => this.unbindXosanLicense({ srId: tmpBoundObjectId }))

  // '172.31.100.0' -> '172.31.100.'
  const networkPrefix = ipRange.split('.').slice(0, 3).join('.') + '.'
  let vmIpLastNumber = VM_FIRST_NUMBER

  try {
    const xosanNetwork = await createNetworkAndInsertHosts(xapi, pif, vlan, networkPrefix)
    $defer.onFailure(() => xapi.deleteNetwork(xosanNetwork))
    const sshKey = await getOrCreateSshKey(xapi)
    const srsObjects = map(srs, srId => xapi.getObject(srId))
    await Promise.all(
      srsObjects.map(sr =>
        callPlugin(xapi, sr.$PBDs[0].$host, 'receive_ssh_keys', {
          private_key: sshKey.private,
          public_key: sshKey.public,
          force: 'true',
        })
      )
    )

    const firstSr = srsObjects[0]
    CURRENT_POOL_OPERATIONS[poolId] = { ...OPERATION_OBJECT, state: 1 }
    const firstVM = await this::_importGlusterVM(xapi, template, firstSr)
    $defer.onFailure(() => xapi.VM_destroy(firstVM.$ref, true))
    CURRENT_POOL_OPERATIONS[poolId] = { ...OPERATION_OBJECT, state: 2 }
    const copiedVms = await asyncMapSettled(srsObjects.slice(1), sr =>
      copyVm(xapi, firstVM, sr)::tap(({ vm }) => $defer.onFailure(() => xapi.VM_destroy(vm.$ref)))
    )
    const vmsAndSrs = [
      {
        vm: firstVM,
        sr: firstSr,
      },
    ].concat(copiedVms)
    let arbiter = null
    CURRENT_POOL_OPERATIONS[poolId] = { ...OPERATION_OBJECT, state: 3 }
    if (srs.length === 2) {
      const sr = firstSr
      const arbiterIP = networkPrefix + vmIpLastNumber++
      const arbiterVm = await xapi.copyVm(firstVM, { srOrSrId: sr })
      $defer.onFailure(() => xapi.VM_destroy(arbiterVm.$ref, true))
      arbiter = await _prepareGlusterVm(xapi, sr, arbiterVm, xosanNetwork, arbiterIP, {
        labelSuffix: '_arbiter',
        increaseDataDisk: false,
        memorySize,
      })
      arbiter.arbiter = true
    }
    const ipAndHosts = await asyncMapSettled(vmsAndSrs, vmAndSr =>
      _prepareGlusterVm(xapi, vmAndSr.sr, vmAndSr.vm, xosanNetwork, networkPrefix + vmIpLastNumber++, {
        maxDiskSize: brickSize,
        memorySize,
      })
    )
    const glusterEndpoint = {
      xapi,
      hosts: map(ipAndHosts, ih => ih.host),
      addresses: map(ipAndHosts, ih => ih.address),
    }
    CURRENT_POOL_OPERATIONS[poolId] = { ...OPERATION_OBJECT, state: 4 }
    await configureGluster(redundancy, ipAndHosts, glusterEndpoint, glusterType, arbiter)
    log.debug('xosan gluster volume started')
    // We use 10 IPs of the gluster VM range as backup, in the hope that even if the first VM gets destroyed we find at least
    // one VM to give mount the volfile.
    // It is not possible to edit the device_config after the SR is created and this data is only used at mount time when rebooting
    // the hosts.
    const backupservers = map(
      range(VM_FIRST_NUMBER, VM_FIRST_NUMBER + 10),
      ipLastByte => networkPrefix + ipLastByte
    ).join(':')
    const config = { server: ipAndHosts[0].address + ':/xosan', backupservers }
    CURRENT_POOL_OPERATIONS[poolId] = { ...OPERATION_OBJECT, state: 5 }
    const xosanSrRef = await xapi.SR_create({
      content_type: '',
      device_config: config,
      host: firstSr.$PBDs[0].$host.$ref,
      name_description: 'XOSAN',
      name_label: 'XOSAN',
      physical_size: 0,
      shared: true,
      type: 'xosan',
    })
    log.debug('sr created')
    // we just forget because the cleanup actions are stacked in the $onFailure system
    $defer.onFailure(() => xapi.forgetSr(xosanSrRef))
    if (arbiter) {
      ipAndHosts.push(arbiter)
    }
    const nodes = ipAndHosts.map(param => ({
      brickName: param.brickName,
      host: param.host.$id,
      vm: { id: param.vm.$id, ip: param.address },
      underlyingSr: param.underlyingSr.$id,
      arbiter: !!param.arbiter,
    }))
    await xapi.xo.setData(xosanSrRef, 'xosan_config', {
      version: 'beta2',
      creationDate: new Date().toISOString(),
      nodes,
      template,
      network: xosanNetwork.$id,
      type: glusterType,
      networkPrefix,
      redundancy,
    })
    CURRENT_POOL_OPERATIONS[poolId] = { ...OPERATION_OBJECT, state: 6 }
    log.debug('scanning new SR')
    await xapi.callAsync('SR.scan', xosanSrRef)
    await this.rebindLicense({
      licenseId: license.id,
      oldBoundObjectId: tmpBoundObjectId,
      newBoundObjectId: xapi.getObject(xosanSrRef).uuid,
    })
  } finally {
    delete CURRENT_POOL_OPERATIONS[poolId]
  }
})

createSR.description = 'create gluster VM'
createSR.permission = 'admin'
createSR.params = {
  brickSize: { type: 'number', optional: true },
  srs: {
    type: 'array',
    items: {
      type: 'string',
    },
  },
  template: { type: 'object' },
  pif: {
    type: 'string',
  },
  vlan: {
    type: 'string',
  },
  glusterType: {
    type: 'string',
  },
  redundancy: {
    type: 'number',
  },
  memorySize: {
    type: 'number',
    optional: true,
  },
  ipRange: {
    type: 'string',
    optional: true,
  },
}

createSR.resolve = {
  srs: ['sr', 'SR', 'administrate'],
  pif: ['pif', 'PIF', 'administrate'],
}

async function umountDisk(localEndpoint, diskMountPoint) {
  await remoteSsh(
    localEndpoint,
    `killall -v -w /usr/sbin/xfs_growfs; fuser -v ${diskMountPoint}; umount ${diskMountPoint} && sed -i '\\_${diskMountPoint}\\S_d' /etc/fstab && rm -rf ${diskMountPoint}`
  )
}

async function createNewDisk(xapi, sr, vm, diskSize) {
  // https://github.com/xapi-project/sm/blob/c9e959b70b43930b33f3a5abe5afe0a36dc95f06/drivers/vhdutil.py#L31
  const vdiMax = 2040 * 1024 * 1024 * 1024
  const createVdiSize = Math.min(vdiMax, diskSize)
  const extensionSize = diskSize - createVdiSize
  const newDisk = await xapi._getOrWaitObject(
    await xapi.VDI_create(
      {
        name_description: 'Created by XO',
        name_label: 'xosan_data',
        SR: sr.$ref,
        virtual_size: createVdiSize,
      },
      { sm_config: { type: 'raw' } }
    )
  )
  if (extensionSize > 0) {
    const { type, uuid: srUuid, $PBDs } = xapi.getObject(sr)
    const volume = `/dev/VG_XenStorage-${srUuid}/LV-${newDisk.uuid}`
    assert.strictEqual(type, 'lvm')
    const result = await callPlugin(xapi, $PBDs[0].$host, 'run_lvextend', {
      sizeDiffMb: '+' + Math.floor(extensionSize / Math.pow(2, 20)),
      volume,
    })
    if (result.exit !== 0) {
      throw Error('Could not create volume ->' + result.stdout)
    }
    await xapi.callAsync('SR.scan', xapi.getObject(sr).$ref)
  }
  await xapi.VBD_create({ VDI: newDisk.$ref, VM: vm.$ref })
  let vbd = (await xapi._waitObjectState(newDisk.$id, disk => Boolean(disk.$VBDs.length))).$VBDs[0]
  vbd = await xapi._waitObjectState(vbd.$id, vbd => Boolean(vbd.device.length))
  return '/dev/' + vbd.device
}

async function mountNewDisk(localEndpoint, hostname, newDeviceFiledeviceFile) {
  const brickRootCmd =
    'bash -c \'mkdir -p /bricks; for TESTVAR in {1..9}; do TESTDIR="/bricks/xosan$TESTVAR" ;if mkdir $TESTDIR; then echo $TESTDIR; exit 0; fi ; done ; exit 1\''
  const newBrickRoot = (await remoteSsh(localEndpoint, brickRootCmd)).stdout.trim()
  const brickName = `${hostname}:${newBrickRoot}/xosandir`
  const mountBrickCmd = `mkfs.xfs -i size=512 ${newDeviceFiledeviceFile}; mkdir -p ${newBrickRoot}; echo "${newDeviceFiledeviceFile} ${newBrickRoot} xfs defaults 0 0" >> /etc/fstab; mount -a`
  await remoteSsh(localEndpoint, mountBrickCmd)
  return brickName
}

async function replaceBrickOnSameVM(xosansr, previousBrick, newLvmSr, brickSize) {
  const OPERATION_OBJECT = {
    operation: 'replaceBrick',
    states: ['creatingNewDisk', 'mountingDisk', 'swappingBrick', 'disconnectingOldDisk', 'scanningSr'],
  }
  const xapi = this.getXapi(xosansr)
  const poolId = xapi.pool.$id
  try {
    CURRENT_POOL_OPERATIONS[poolId] = { ...OPERATION_OBJECT, state: 0 }

    // TODO: a bit of user input validation on 'previousBrick', it's going to ssh
    const previousIp = previousBrick.split(':')[0]
    brickSize = brickSize === undefined ? Infinity : brickSize
    const data = this::getXosanConfig(xosansr)
    const nodes = data.nodes
    const nodeIndex = nodes.findIndex(node => node.vm.ip === previousIp)
    const glusterEndpoint = this::_getGlusterEndpoint(xosansr)
    const previousVM = _getIPToVMDict(xapi, xosansr)[previousBrick].vm
    const newDeviceFile = await createNewDisk(xapi, newLvmSr, previousVM, brickSize)
    const localEndpoint = {
      xapi,
      hosts: map(nodes, node => xapi.getObject(node.host)),
      addresses: [previousIp],
    }
    const previousBrickRoot = previousBrick.split(':')[1].split('/').slice(0, 3).join('/')
    const previousBrickDevice = (
      await remoteSsh(localEndpoint, `grep " ${previousBrickRoot} " /proc/mounts | cut -d ' ' -f 1 | sed 's_/dev/__'`)
    ).stdout.trim()
    CURRENT_POOL_OPERATIONS[poolId] = { ...OPERATION_OBJECT, state: 1 }
    const brickName = await mountNewDisk(localEndpoint, previousIp, newDeviceFile)
    CURRENT_POOL_OPERATIONS[poolId] = { ...OPERATION_OBJECT, state: 2 }
    await glusterCmd(glusterEndpoint, `volume replace-brick xosan ${previousBrick} ${brickName} commit force`)
    nodes[nodeIndex].brickName = brickName
    nodes[nodeIndex].underlyingSr = newLvmSr
    await xapi.xo.setData(xosansr, 'xosan_config', data)
    CURRENT_POOL_OPERATIONS[poolId] = { ...OPERATION_OBJECT, state: 3 }
    await umountDisk(localEndpoint, previousBrickRoot)
    const previousVBD = previousVM.$VBDs.find(vbd => vbd.device === previousBrickDevice)
    await previousVBD.$unplug()
    await xapi.VDI_destroy(previousVBD.VDI)
    CURRENT_POOL_OPERATIONS[poolId] = { ...OPERATION_OBJECT, state: 4 }
    await xapi.callAsync('SR.scan', xapi.getObject(xosansr).$ref)
  } finally {
    delete CURRENT_POOL_OPERATIONS[poolId]
  }
}

export async function replaceBrick({ xosansr, previousBrick, newLvmSr, brickSize, onSameVM = true }) {
  await this.checkXosanLicense({ srId: xosansr.uuid })

  const OPERATION_OBJECT = {
    operation: 'replaceBrick',
    states: ['insertingNewVm', 'swappingBrick', 'deletingVm', 'scanningSr'],
  }
  if (onSameVM) {
    return this::replaceBrickOnSameVM(xosansr, previousBrick, newLvmSr, brickSize)
  }
  const xapi = this.getXapi(xosansr)
  const poolId = xapi.pool.$id
  try {
    // TODO: a bit of user input validation on 'previousBrick', it's going to ssh
    const previousIp = previousBrick.split(':')[0]
    brickSize = brickSize === undefined ? Infinity : brickSize
    const data = getXosanConfig(xosansr, xapi)
    const nodes = data.nodes
    const newIpAddress = _findAFreeIPAddress(nodes, data.networkPrefix)
    const nodeIndex = nodes.findIndex(node => node.vm.ip === previousIp)
    const stayingNodes = filter(nodes, (node, index) => index !== nodeIndex)
    const glusterEndpoint = {
      xapi,
      hosts: map(stayingNodes, node => xapi.getObject(node.host)),
      addresses: map(stayingNodes, node => node.vm.ip),
    }
    const previousVMEntry = _getIPToVMDict(xapi, xosansr)[previousBrick]
    const arbiter = nodes[nodeIndex].arbiter
    CURRENT_POOL_OPERATIONS[poolId] = { ...OPERATION_OBJECT, state: 0 }
    const { newVM, addressAndHost } = await this::insertNewGlusterVm(xapi, xosansr, newLvmSr, {
      labelSuffix: arbiter ? '_arbiter' : '',
      glusterEndpoint,
      newIpAddress,
      increaseDataDisk: !arbiter,
      brickSize,
    })
    CURRENT_POOL_OPERATIONS[poolId] = { ...OPERATION_OBJECT, state: 1 }
    await glusterCmd(
      glusterEndpoint,
      `volume replace-brick xosan ${previousBrick} ${addressAndHost.brickName} commit force`
    )
    await glusterCmd(glusterEndpoint, 'peer detach ' + previousIp)
    data.nodes.splice(nodeIndex, 1, {
      brickName: addressAndHost.brickName,
      host: addressAndHost.host.$id,
      arbiter,
      vm: { ip: addressAndHost.address, id: newVM.$id },
      underlyingSr: newLvmSr,
    })
    await xapi.xo.setData(xosansr, 'xosan_config', data)
    CURRENT_POOL_OPERATIONS[poolId] = { ...OPERATION_OBJECT, state: 2 }
    if (previousVMEntry) {
      await xapi.VM_destroy(previousVMEntry.vm.$ref, true)
    }
    CURRENT_POOL_OPERATIONS[poolId] = { ...OPERATION_OBJECT, state: 3 }
    await xapi.callAsync('SR.scan', xapi.getObject(xosansr).$ref)
  } finally {
    delete CURRENT_POOL_OPERATIONS[poolId]
  }
}

replaceBrick.description = 'replaceBrick brick in gluster volume'
replaceBrick.permission = 'admin'
replaceBrick.params = {
  xosansr: { type: 'string' },
  previousBrick: { type: 'string' },
  newLvmSr: { type: 'string' },
  brickSize: { type: 'number' },
}

replaceBrick.resolve = {
  xosansr: ['sr', 'SR', 'administrate'],
}

async function _prepareGlusterVm(
  xapi,
  lvmSr,
  newVM,
  xosanNetwork,
  ipAddress,
  { labelSuffix = '', increaseDataDisk = true, maxDiskSize = Infinity, memorySize = 2 * GIGABYTE }
) {
  const host = lvmSr.$PBDs[0].$host
  const xenstoreData = {
    'vm-data/hostname': 'XOSAN' + lvmSr.name_label + labelSuffix,
    'vm-data/sshkey': (await getOrCreateSshKey(xapi)).public,
    'vm-data/ip': ipAddress,
    'vm-data/mtu': String(xosanNetwork.MTU),
    'vm-data/vlan': String(xosanNetwork.$PIFs[0].vlan || 0),
  }
  const ip = ipAddress
  const sr = xapi.getObject(lvmSr.$id)
  // refresh the object so that sizes are correct
  await xapi._waitObjectState(sr.$id, sr => Boolean(sr.$PBDs))
  const firstVif = newVM.$VIFs[0]
  if (xosanNetwork.$id !== firstVif.$network.$id) {
    try {
      await xapi.callAsync('VIF.move', firstVif.$ref, xosanNetwork.$ref)
    } catch (error) {
      if (error.code === 'MESSAGE_METHOD_UNKNOWN') {
        // VIF.move has been introduced in xenserver 7.0
        await xapi.deleteVif(firstVif.$id)
        await xapi.VIF_create(
          {
            ...firstVif,
            VM: newVM.$ref,
            network: xosanNetwork.$ref,
          },
          firstVif
        )
      }
    }
  }
  await newVM.add_tags('XOSAN')
  await xapi.editVm(newVM, {
    name_label: `XOSAN - ${lvmSr.name_label} - ${host.name_label} ${labelSuffix}`,
    name_description: 'Xosan VM storage',
    memory: memorySize,
  })
  await newVM.set_xenstore_data(xenstoreData)
  const rootDisk = newVM.$VBDs.map(vbd => vbd && vbd.$VDI).find(vdi => vdi && vdi.name_label === 'xosan_root')
  const rootDiskSize = rootDisk.virtual_size
  await xapi.startVm(newVM)
  log.debug(`waiting for boot of ${ip}`)
  // wait until we find the assigned IP in the networks, we are just checking the boot is complete
  // fix #3688
  const vm = await xapi._waitObjectState(newVM.$id, _ => Ref.isNotEmpty(_.guest_metrics))
  await xapi._waitObjectState(vm.guest_metrics, _ => includes(_.networks, ip))
  log.debug(`booted ${ip}`)
  const localEndpoint = { xapi, hosts: [host], addresses: [ip] }
  const srFreeSpace = sr.physical_size - sr.physical_utilisation
  // we use a percentage because it looks like the VDI overhead is proportional
  const newSize = floor2048(Math.min(maxDiskSize - rootDiskSize, srFreeSpace * XOSAN_DATA_DISK_USAGE_RATIO))
  const smallDiskSize = 1073741824
  const deviceFile = await createNewDisk(xapi, lvmSr, newVM, increaseDataDisk ? newSize : smallDiskSize)
  const brickName = await mountNewDisk(localEndpoint, ip, deviceFile)
  return { address: ip, host, vm, underlyingSr: lvmSr, brickName }
}

async function _importGlusterVM(xapi, template, lvmsrId) {
  const templateStream = await this.requestResource({
    id: template.id,
    namespace: 'xosan',
    version: template.version,
  })
  const newVM = await xapi._getOrWaitObject(
    await xapi.VM_import(templateStream, this.getObject(lvmsrId, 'SR')._xapiRef)
  )
  await xapi.editVm(newVM, {
    autoPoweron: true,
    name_label: 'XOSAN imported VM',
    name_description: 'freshly imported',
  })
  return xapi.barrier(newVM.$ref)
}

function _findAFreeIPAddress(nodes, networkPrefix) {
  return _findIPAddressOutsideList(
    map(nodes, n => n.vm.ip),
    networkPrefix
  )
}

function _findIPAddressOutsideList(reservedList, networkPrefix, vmIpLastNumber = 101) {
  for (let i = vmIpLastNumber; i < 255; i++) {
    const candidate = networkPrefix + i
    if (!reservedList.find(a => a === candidate)) {
      return candidate
    }
  }
  return null
}

const _median = arr => {
  arr.sort((a, b) => a - b)
  return arr[Math.floor(arr.length / 2)]
}

const insertNewGlusterVm = defer(async function (
  $defer,
  xapi,
  xosansr,
  lvmsrId,
  { labelSuffix = '', glusterEndpoint = null, ipAddress = null, increaseDataDisk = true, brickSize = Infinity }
) {
  const data = getXosanConfig(xosansr, xapi)
  if (ipAddress === null) {
    ipAddress = _findAFreeIPAddress(data.nodes, data.networkPrefix)
  }
  const vmsMemories = []
  for (const node of data.nodes) {
    try {
      vmsMemories.push(xapi.getObject(node.vm.id).memory_dynamic_max)
    } catch (e) {
      // pass
    }
  }
  const xosanNetwork = xapi.getObject(data.network)
  const srObject = xapi.getObject(lvmsrId)
  // can't really copy an existing VM, because existing gluster VMs disks might too large to be copied.
  const newVM = await this::_importGlusterVM(xapi, data.template, lvmsrId)
  $defer.onFailure(() => xapi.VM_destroy(newVM.$ref, true))
  const addressAndHost = await _prepareGlusterVm(xapi, srObject, newVM, xosanNetwork, ipAddress, {
    labelSuffix,
    increaseDataDisk,
    maxDiskSize: brickSize,
    memorySize: vmsMemories.length ? _median(vmsMemories) : 2 * GIGABYTE,
  })
  if (!glusterEndpoint) {
    glusterEndpoint = this::_getGlusterEndpoint(xosansr)
  }
  await _probePoolAndWaitForPresence(glusterEndpoint, [addressAndHost.address])
  return { data, newVM, addressAndHost, glusterEndpoint }
})

export const addBricks = defer(async function ($defer, { xosansr, lvmsrs, brickSize }) {
  await this.checkXosanLicense({ srId: xosansr.uuid })

  const OPERATION_OBJECT = {
    operation: 'addBricks',
    states: ['insertingNewVms', 'addingBricks', 'scanningSr'],
  }
  const xapi = this.getXapi(xosansr)
  const poolId = xapi.pool.$id
  if (CURRENT_POOL_OPERATIONS[poolId]) {
    throw new Error('createSR is already running for this pool')
  }
  CURRENT_POOL_OPERATIONS[poolId] = { ...OPERATION_OBJECT, state: 0 }
  try {
    const data = getXosanConfig(xosansr, xapi)
    const usedAddresses = map(data.nodes, n => n.vm.ip)
    const glusterEndpoint = this::_getGlusterEndpoint(xosansr)
    const newAddresses = []
    const newNodes = []
    for (const newSr of lvmsrs) {
      const ipAddress = _findIPAddressOutsideList(usedAddresses.concat(newAddresses), data.networkPrefix)
      newAddresses.push(ipAddress)
      const { newVM, addressAndHost } = await this::insertNewGlusterVm(xapi, xosansr, newSr, { ipAddress, brickSize })
      $defer.onFailure(() => glusterCmd(glusterEndpoint, 'peer detach ' + ipAddress, true))
      $defer.onFailure(() => xapi.VM_destroy(newVM.$ref, true))
      const brickName = addressAndHost.brickName
      newNodes.push({
        brickName,
        host: addressAndHost.host.$id,
        vm: { id: newVM.$id, ip: ipAddress },
        underlyingSr: newSr,
      })
    }
    const arbiterNode = data.nodes.find(n => n.arbiter)
    if (arbiterNode) {
      await glusterCmd(
        glusterEndpoint,
        `volume remove-brick xosan replica ${data.nodes.length - 1} ${arbiterNode.brickName} force`
      )
      data.nodes = data.nodes.filter(n => n !== arbiterNode)
      data.type = 'replica'
      await xapi.xo.setData(xosansr, 'xosan_config', data)
      await glusterCmd(glusterEndpoint, 'peer detach ' + arbiterNode.vm.ip, true)
      await xapi.VM_destroy(await xapi.call('VM.get_by_uuid', arbiterNode.vm.id), true)
    }
    CURRENT_POOL_OPERATIONS[poolId] = { ...OPERATION_OBJECT, state: 1 }
    await glusterCmd(glusterEndpoint, `volume add-brick xosan ${newNodes.map(n => n.brickName).join(' ')}`)
    data.nodes = data.nodes.concat(newNodes)
    await xapi.xo.setData(xosansr, 'xosan_config', data)
    CURRENT_POOL_OPERATIONS[poolId] = { ...OPERATION_OBJECT, state: 2 }
    await xapi.callAsync('SR.scan', xapi.getObject(xosansr).$ref)
  } finally {
    delete CURRENT_POOL_OPERATIONS[poolId]
  }
})

addBricks.description = 'add brick to XOSAN SR'
addBricks.permission = 'admin'
addBricks.params = {
  xosansr: { type: 'string' },
  lvmsrs: {
    type: 'array',
    items: {
      type: 'string',
    },
  },
  brickSize: { type: 'number' },
}

addBricks.resolve = {
  xosansr: ['sr', 'SR', 'administrate'],
  lvmsrs: ['sr', 'SR', 'administrate'],
}

export const removeBricks = defer(async function ($defer, { xosansr, bricks }) {
  await this.checkXosanLicense({ srId: xosansr.uuid })

  const xapi = this.getXapi(xosansr)
  if (CURRENT_POOL_OPERATIONS[xapi.pool.$id]) {
    throw new Error('this there is already a XOSAN operation running on this pool')
  }
  CURRENT_POOL_OPERATIONS[xapi.pool.$id] = true
  try {
    const data = getXosanConfig(xosansr.id, xapi)
    // IPV6
    const ips = map(bricks, b => b.split(':')[0])
    const glusterEndpoint = this::_getGlusterEndpoint(xosansr.id)
    // "peer detach" doesn't allow removal of localhost
    remove(glusterEndpoint.addresses, ip => ips.includes(ip))
    const dict = _getIPToVMDict(xapi, xosansr.id)
    const brickVMs = map(bricks, b => dict[b])
    await glusterCmd(glusterEndpoint, `volume remove-brick xosan ${bricks.join(' ')} force`)
    await asyncMapSettled(ips, ip => glusterCmd(glusterEndpoint, 'peer detach ' + ip, true))
    remove(data.nodes, node => ips.includes(node.vm.ip))
    await xapi.xo.setData(xosansr.id, 'xosan_config', data)
    await xapi.callAsync('SR.scan', xapi.getObject(xosansr._xapiId).$ref)
    await asyncMapSettled(brickVMs, vm => xapi.VM_destroy(vm.vm.$ref, true))
  } finally {
    delete CURRENT_POOL_OPERATIONS[xapi.pool.$id]
  }
})

removeBricks.description = 'remove brick from XOSAN SR'
removeBricks.permission = 'admin'
removeBricks.params = {
  xosansr: { type: 'string' },
  bricks: {
    type: 'array',
    items: { type: 'string' },
  },
}
removeBricks.resolve = { xosansr: ['sr', 'SR', 'administrate'] }

export function checkSrCurrentState({ poolId }) {
  return CURRENT_POOL_OPERATIONS[poolId]
}

checkSrCurrentState.description = 'checks if there is an operation currently running on the SR'
checkSrCurrentState.permission = 'admin'
checkSrCurrentState.params = { poolId: { type: 'string' } }

const POSSIBLE_CONFIGURATIONS = {}
POSSIBLE_CONFIGURATIONS[2] = [{ layout: 'replica_arbiter', redundancy: 3, capacity: 1 }]
POSSIBLE_CONFIGURATIONS[3] = [
  { layout: 'replica', redundancy: 3, capacity: 1 },
  { layout: 'disperse', redundancy: 1, capacity: 2 },
]
POSSIBLE_CONFIGURATIONS[4] = [{ layout: 'replica', redundancy: 2, capacity: 2 }]
POSSIBLE_CONFIGURATIONS[5] = [{ layout: 'disperse', redundancy: 1, capacity: 4 }]
POSSIBLE_CONFIGURATIONS[6] = [
  { layout: 'replica', redundancy: 2, capacity: 3 },
  { layout: 'replica', redundancy: 3, capacity: 2 },
  { layout: 'disperse', redundancy: 2, capacity: 4 },
]
POSSIBLE_CONFIGURATIONS[7] = [{ layout: 'disperse', redundancy: 3, capacity: 4 }]
POSSIBLE_CONFIGURATIONS[8] = [{ layout: 'replica', redundancy: 2, capacity: 4 }]
POSSIBLE_CONFIGURATIONS[9] = [
  { layout: 'replica', redundancy: 3, capacity: 3 },
  { layout: 'disperse', redundancy: 1, capacity: 8 },
]
POSSIBLE_CONFIGURATIONS[10] = [
  { layout: 'replica', redundancy: 2, capacity: 5 },
  { layout: 'disperse', redundancy: 2, capacity: 8 },
]
POSSIBLE_CONFIGURATIONS[11] = [{ layout: 'disperse', redundancy: 3, capacity: 8 }]
POSSIBLE_CONFIGURATIONS[12] = [
  { layout: 'replica', redundancy: 2, capacity: 6 },
  { layout: 'disperse', redundancy: 4, capacity: 8 },
]
POSSIBLE_CONFIGURATIONS[13] = [{ layout: 'disperse', redundancy: 5, capacity: 8 }]
POSSIBLE_CONFIGURATIONS[14] = [
  { layout: 'replica', redundancy: 2, capacity: 7 },
  { layout: 'disperse', redundancy: 6, capacity: 8 },
]
POSSIBLE_CONFIGURATIONS[15] = [
  { layout: 'replica', redundancy: 3, capacity: 5 },
  { layout: 'disperse', redundancy: 7, capacity: 8 },
]
POSSIBLE_CONFIGURATIONS[16] = [{ layout: 'replica', redundancy: 2, capacity: 8 }]

function computeBrickSize(srs, brickSize = Infinity) {
  const xapi = this.getXapi(srs[0])
  const srsObjects = map(srs, srId => xapi.getObject(srId))
  const srSizes = map(srsObjects, sr => sr.physical_size - sr.physical_utilisation)
  const minSize = Math.min(brickSize, ...srSizes)
  return Math.floor((minSize - XOSAN_VM_SYSTEM_DISK_SIZE) * XOSAN_DATA_DISK_USAGE_RATIO)
}

export async function computeXosanPossibleOptions({ lvmSrs, brickSize = Infinity }) {
  const count = lvmSrs.length
  const configurations = POSSIBLE_CONFIGURATIONS[count]
  if (!configurations) {
    return null
  }
  if (count > 0) {
    const finalBrickSize = this::computeBrickSize(lvmSrs, brickSize)
    return configurations.map(conf => ({
      ...conf,
      availableSpace: Math.max(0, finalBrickSize * conf.capacity),
    }))
  }
}

computeXosanPossibleOptions.params = {
  lvmSrs: {
    type: 'array',
    items: {
      type: 'string',
    },
  },
  brickSize: {
    type: 'number',
    optional: true,
  },
}

// ---------------------------------------------------------------------

export async function unlock({ licenseId, sr }) {
  await this.unlockXosanLicense({ licenseId, srId: sr.id })

  const glusterEndpoint = this::_getGlusterEndpoint(sr.id)
  await _removeQuota(glusterEndpoint)
  await glusterEndpoint.xapi.call('SR.scan', glusterEndpoint.xapi.getObject(sr).$ref)
}

unlock.description = 'Unlock XOSAN SR functionalities by binding it to a paid license'

unlock.permission = 'admin'

unlock.params = {
  licenseId: { type: 'string' },
  sr: { type: 'string' },
}

unlock.resolve = {
  sr: ['sr', 'SR', 'administrate'],
}

// ---------------------------------------------------------------------

export async function downloadAndInstallXosanPack({ id, version, pool }) {
  if (!this.requestResource) {
    throw new Error('requestResource is not a function')
  }

  const xapi = this.getXapi(pool.id)
  const res = await this.requestResource({
    id,
    namespace: 'xosan',
    version,
  })
  await xapi.installSupplementalPackOnAllHosts(res)
  await xapi.pool.update_other_config('xosan_pack_installation_time', String(Math.floor(Date.now() / 1e3)))
}

downloadAndInstallXosanPack.description = 'Register a resource via cloud plugin'

downloadAndInstallXosanPack.params = {
  id: { type: 'string' },
  version: { type: 'string' },
  pool: { type: 'string' },
}

downloadAndInstallXosanPack.resolve = {
  pool: ['pool', 'pool', 'administrate'],
}

downloadAndInstallXosanPack.permission = 'admin'
