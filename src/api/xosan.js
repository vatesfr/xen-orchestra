import createLogger from 'debug'
import defer from 'golike-defer'
import execa from 'execa'
import fs from 'fs-extra'
import map from 'lodash/map'
import { tap, delay } from 'promise-toolbox'
import {
  includes,
  isArray,
  remove,
  filter,
  range
} from 'lodash'
import {
  asyncMap,
  parseXml
} from '../utils'

const debug = createLogger('xo:xosan')

const SSH_KEY_FILE = 'id_rsa_xosan'
const NETWORK_PREFIX = '172.31.100.'
const VM_FIRST_NUMBER = 101
const GIGABYTE = 1024 * 1024 * 1024
const XOSAN_VM_SYSTEM_DISK_SIZE = 10 * GIGABYTE
const XOSAN_DATA_DISK_USEAGE_RATIO = 0.99
const XOSAN_MAX_DISK_SIZE = 2093050 * 1024 * 1024 // a bit under 2To

const CURRENTLY_CREATING_SRS = {}

function _getIPToVMDict (xapi, sr) {
  const dict = {}
  const data = xapi.xo.getData(sr, 'xosan_config')
  if (data && data.nodes) {
    data.nodes.forEach(conf => {
      try {
        dict[conf.brickName] = {vm: xapi.getObject(conf.vm.id), sr: conf.underlyingSr}
      } catch (e) {
        // pass
      }
    })
  }
  return dict
}

function _getGlusterEndpoint (sr) {
  const xapi = this.getXapi(sr)
  const data = xapi.xo.getData(sr, 'xosan_config')
  if (!data || !data.nodes) {
    return null
  }
  return { xapi, data: data, hosts: map(data.nodes, node => xapi.getObject(node.host)), addresses: map(data.nodes, node => node.vm.ip) }
}

async function rateLimitedRetry (action, shouldRetry, retryCount = 20) {
  let retryDelay = 500 * (1 + Math.random() / 20)
  let result
  while (retryCount > 0 && (result = await action()) && shouldRetry(result)) {
    retryDelay *= 1.1
    debug('waiting ' + retryDelay + 'ms and retrying')
    await delay(retryDelay)
    retryCount--
  }
  return result
}

export async function getVolumeInfo ({ sr, infoType }) {
  const glusterEndpoint = this::_getGlusterEndpoint(sr)

  function parseHeal (parsed) {
    const bricks = []
    parsed['healInfo']['bricks']['brick'].forEach(brick => {
      bricks.push(brick)
      if (brick['file'] && !isArray(brick['file'])) {
        brick['file'] = [brick['file']]
      }
    })
    return {commandStatus: true, result: {bricks}}
  }

  function parseStatus (parsed) {
    const brickDictByUuid = {}
    const volume = parsed['volStatus']['volumes']['volume']
    volume['node'].forEach(node => {
      brickDictByUuid[node.peerid] = brickDictByUuid[node.peerid] || []
      brickDictByUuid[node.peerid].push(node)
    })
    return {
      commandStatus: true,
      result: {nodes: brickDictByUuid, tasks: volume['tasks']}
    }
  }

  function parseInfo (parsed) {
    const volume = parsed['volInfo']['volumes']['volume']
    volume['bricks'] = volume['bricks']['brick']
    volume['options'] = volume['options']['option']
    return {commandStatus: true, result: volume}
  }

  const infoTypes = {
    heal: {command: 'heal xosan info', handler: parseHeal},
    status: {command: 'status xosan', handler: parseStatus},
    statusDetail: {command: 'status xosan detail', handler: parseStatus},
    statusMem: {command: 'status xosan mem', handler: parseStatus},
    info: {command: 'info xosan', handler: parseInfo}
  }
  const foundType = infoTypes[infoType]
  if (!foundType) {
    throw new Error('getVolumeInfo(): "' + infoType + '" is an invalid type')
  }

  const cmdShouldRetry =
      result => !result['commandStatus'] && result.parsed && result.parsed['cliOutput']['opErrno'] === '30802'
  const runCmd = async () => glusterCmd(glusterEndpoint, 'volume ' + foundType.command, true)
  let commandResult = await rateLimitedRetry(runCmd, cmdShouldRetry)
  return commandResult['commandStatus'] ? foundType.handler(commandResult.parsed['cliOutput']) : commandResult
}

getVolumeInfo.description = 'info on gluster volume'
getVolumeInfo.permission = 'admin'

getVolumeInfo.params = {
  sr: {
    type: 'string'
  },
  infoType: {
    type: 'string'
  }
}
getVolumeInfo.resolve = {
  sr: ['sr', 'SR', 'administrate']
}
function floor2048 (value) {
  return 2048 * Math.floor(value / 2048)
}

async function copyVm (xapi, originalVm, sr) {
  return { sr, vm: await xapi.copyVm(originalVm, sr) }
}

async function callPlugin (xapi, host, command, params) {
  debug('calling plugin', host.address, command)
  return JSON.parse(await xapi.call('host.call_plugin', host.$ref, 'xosan.py', command, params))
}

async function remoteSsh (glusterEndpoint, cmd, ignoreError = false) {
  let result
  for (let address of glusterEndpoint.addresses) {
    for (let host of glusterEndpoint.hosts) {
      try {
        result = await callPlugin(glusterEndpoint.xapi, host, 'run_ssh', {destination: 'root@' + address, cmd: cmd})
        break
      } catch (exception) {
        if (exception['code'] !== 'HOST_OFFLINE') {
          throw exception
        }
      }
    }
    debug(result.command.join(' '), '\n  =>exit:', result.exit, '\n  =>err :', result.stderr,
      '\n  =>out (1000 chars) :', result.stdout.substring(0, 1000))
    // 255 seems to be ssh's own error codes.
    if (result.exit !== 255) {
      if (!ignoreError && result.exit !== 0) {
        throw new Error('ssh error: ' + JSON.stringify(result))
      }
      return result
    }
  }
  throw new Error(result ? 'ssh error: ' + JSON.stringify(result) : 'no suitable SSH host: ' +
    JSON.stringify(glusterEndpoint))
}

function findErrorMessage (commandResut) {
  if (commandResut['exit'] === 0 && commandResut.parsed) {
    const cliOut = commandResut.parsed['cliOutput']
    if (cliOut['opErrstr'] && cliOut['opErrstr'].length) {
      return cliOut['opErrstr']
    }
    // "peer probe" returns it's "already in peer" error in cliOutput/output
    if (cliOut['output'] && cliOut['output'].length) {
      return cliOut['output']
    }
  }
  return commandResut['stderr'].length ? commandResut['stderr'] : commandResut['stdout']
}

async function glusterCmd (glusterEndpoint, cmd, ignoreError = false) {
  const result = await remoteSsh(glusterEndpoint, `gluster --mode=script --xml ${cmd}`, true)
  try {
    result.parsed = parseXml(result['stdout'])
  } catch (e) {
    // pass, we never know if a message can be parsed or not, so we just try
  }
  if (result['exit'] === 0) {
    const cliOut = result.parsed['cliOutput']
    // we have found cases where opErrno is !=0 and opRet was 0, albeit the operation was an error.
    result.commandStatus = cliOut['opRet'].trim() === '0' && cliOut['opErrno'].trim() === '0'
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

const createNetworkAndInsertHosts = defer.onFailure(async function ($onFailure, xapi, pif, vlan) {
  let hostIpLastNumber = 1
  const xosanNetwork = await xapi.createNetwork({
    name: 'XOSAN network',
    description: 'XOSAN network',
    pifId: pif._xapiId,
    mtu: pif.mtu,
    vlan: +vlan
  })
  $onFailure(() => xapi.deleteNetwork(xosanNetwork))
  await Promise.all(xosanNetwork.$PIFs.map(pif => xapi.call('PIF.reconfigure_ip', pif.$ref, 'Static',
    NETWORK_PREFIX + (hostIpLastNumber++), '255.255.255.0', NETWORK_PREFIX + '1', '')))
  return xosanNetwork
})

async function getOrCreateSshKey (xapi) {
  let sshKey = xapi.xo.getData(xapi.pool, 'xosan_ssh_key')

  if (!sshKey) {
    const readKeys = async () => {
      sshKey = {
        private: await fs.readFile(SSH_KEY_FILE, 'ascii'),
        public: await fs.readFile(SSH_KEY_FILE + '.pub', 'ascii')
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

const _probePoolAndWaitForPresence = defer.onFailure(async function ($onFailure, glusterEndpoint, addresses) {
  await asyncMap(addresses, async (address) => {
    await glusterCmd(glusterEndpoint, 'peer probe ' + address)
    $onFailure(() => glusterCmd(glusterEndpoint, 'peer detach ' + address, true))
  })
  function shouldRetry (peers) {
    for (let peer of peers) {
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

async function configureGluster (redundancy, ipAndHosts, glusterEndpoint, glusterType, arbiter = null) {
  const configByType = {
    replica_arbiter: {
      creation: 'replica 3 arbiter 1',
      extra: []
    },
    replica: {
      creation: 'replica ' + redundancy + ' ',
      extra: ['volume set xosan cluster.data-self-heal on']
    },
    disperse: {
      creation: 'disperse ' + ipAndHosts.length + ' redundancy ' + redundancy + ' ',
      extra: []
    }
  }
  let brickVms = arbiter ? ipAndHosts.concat(arbiter) : ipAndHosts
  await _probePoolAndWaitForPresence(glusterEndpoint, map(brickVms.slice(1), bv => bv.address))
  const creation = configByType[glusterType].creation
  const volumeCreation = 'volume create xosan ' + creation + ' ' +
    brickVms.map(ipAndHost => ipAndHost.brickName).join(' ')
  debug('creating volume: ', volumeCreation)
  await glusterCmd(glusterEndpoint, volumeCreation)
  await glusterCmd(glusterEndpoint, 'volume set xosan network.remote-dio enable')
  await glusterCmd(glusterEndpoint, 'volume set xosan cluster.eager-lock enable')
  await glusterCmd(glusterEndpoint, 'volume set xosan performance.io-cache off')
  await glusterCmd(glusterEndpoint, 'volume set xosan performance.read-ahead off')
  await glusterCmd(glusterEndpoint, 'volume set xosan performance.quick-read off')
  await glusterCmd(glusterEndpoint, 'volume set xosan performance.strict-write-ordering off')
  await glusterCmd(glusterEndpoint, 'volume set xosan client.event-threads 8')
  await glusterCmd(glusterEndpoint, 'volume set xosan server.event-threads 8')
  await glusterCmd(glusterEndpoint, 'volume set xosan performance.io-thread-count 64')
  await glusterCmd(glusterEndpoint, 'volume set xosan performance.stat-prefetch on')
  await glusterCmd(glusterEndpoint, 'volume set xosan features.shard on')
  await glusterCmd(glusterEndpoint, 'volume set xosan features.shard-block-size 512MB')
  for (const confChunk of configByType[glusterType].extra) {
    await glusterCmd(glusterEndpoint, confChunk)
  }
  await glusterCmd(glusterEndpoint, 'volume start xosan')
}

export const createSR = defer.onFailure(async function ($onFailure, { template, pif, vlan, srs, glusterType,
  redundancy, brickSize, memorySize }) {
  if (!this.requestResource) {
    throw new Error('requestResource is not a function')
  }

  if (srs.length < 1) {
    return // TODO: throw an error
  }

  let vmIpLastNumber = VM_FIRST_NUMBER
  const xapi = this.getXapi(srs[0])
  if (CURRENTLY_CREATING_SRS[xapi.pool.$id]) {
    throw new Error('createSR is already running for this pool')
  }

  CURRENTLY_CREATING_SRS[xapi.pool.$id] = true
  try {
    const xosanNetwork = await createNetworkAndInsertHosts(xapi, pif, vlan)
    $onFailure(() => xapi.deleteNetwork(xosanNetwork))
    const sshKey = await getOrCreateSshKey(xapi)
    const srsObjects = map(srs, srId => xapi.getObject(srId))
    await Promise.all(srsObjects.map(sr => callPlugin(xapi, sr.$PBDs[0].$host, 'receive_ssh_keys', {
      private_key: sshKey.private,
      public_key: sshKey.public,
      force: 'true'
    })))

    const firstSr = srsObjects[0]
    const firstVM = await this::_importGlusterVM(xapi, template, firstSr)
    $onFailure(() => xapi.deleteVm(firstVM, true))
    const copiedVms = await asyncMap(srsObjects.slice(1), sr =>
      copyVm(xapi, firstVM, sr)::tap(({ vm }) =>
        $onFailure(() => xapi.deleteVm(vm))
      )
    )
    const vmsAndSrs = [{
      vm: firstVM,
      sr: firstSr
    }].concat(copiedVms)
    let arbiter = null
    if (srs.length === 2) {
      const sr = firstSr
      const arbiterIP = NETWORK_PREFIX + (vmIpLastNumber++)
      const arbiterVm = await xapi.copyVm(firstVM, sr)
      $onFailure(() => xapi.deleteVm(arbiterVm, true))
      arbiter = await _prepareGlusterVm(xapi, sr, arbiterVm, xosanNetwork, arbiterIP, {labelSuffix: '_arbiter',
        increaseDataDisk: false,
        memorySize})
      arbiter.arbiter = true
    }
    const ipAndHosts = await asyncMap(vmsAndSrs, vmAndSr => _prepareGlusterVm(xapi, vmAndSr.sr, vmAndSr.vm, xosanNetwork,
      NETWORK_PREFIX + (vmIpLastNumber++), {maxDiskSize: brickSize, memorySize}))
    const glusterEndpoint = { xapi, hosts: map(ipAndHosts, ih => ih.host), addresses: map(ipAndHosts, ih => ih.address) }
    await configureGluster(redundancy, ipAndHosts, glusterEndpoint, glusterType, arbiter)
    debug('xosan gluster volume started')
    // We use 10 IPs of the gluster VM range as backup, in the hope that even if the first VM gets destroyed we find at least
    // one VM to give mount the volfile.
    // It is not possible to edit the device_config after the SR is created and this data is only used at mount time when rebooting
    // the hosts.
    const backupservers = map(range(VM_FIRST_NUMBER, VM_FIRST_NUMBER + 10), ipLastByte => NETWORK_PREFIX + ipLastByte).join(':')
    const config = { server: ipAndHosts[0].address + ':/xosan', backupservers }
    const xosanSrRef = await xapi.call('SR.create', firstSr.$PBDs[0].$host.$ref, config, 0, 'XOSAN', 'XOSAN',
      'xosan', '', true, {})
    // we just forget because the cleanup actions are stacked in the $onFailure system
    $onFailure(() => xapi.forgetSr(xosanSrRef))
    if (arbiter) {
      ipAndHosts.push(arbiter)
    }
    const nodes = ipAndHosts.map(param => ({
      brickName: param.brickName,
      host: param.host.$id,
      vm: {id: param.vm.$id, ip: param.address},
      underlyingSr: param.underlyingSr.$id,
      arbiter: !!param['arbiter']
    }))
    await xapi.xo.setData(xosanSrRef, 'xosan_config', {
      version: 'beta2',
      nodes: nodes,
      template: template,
      network: xosanNetwork.$id,
      type: glusterType,
      redundancy
    })
    debug('scanning new SR')
    await xapi.call('SR.scan', xosanSrRef)
  } finally {
    delete CURRENTLY_CREATING_SRS[xapi.pool.$id]
  }
})

createSR.description = 'create gluster VM'
createSR.permission = 'admin'
createSR.params = {
  srs: {
    type: 'array',
    items: {
      type: 'string'
    }
  },
  pif: {
    type: 'string'
  },
  vlan: {
    type: 'string'
  },
  glusterType: {
    type: 'string'
  },
  redundancy: {
    type: 'number'
  }
}

createSR.resolve = {
  srs: ['sr', 'SR', 'administrate'],
  pif: ['pif', 'PIF', 'administrate']
}

async function umountDisk (localEndpoint, diskMountPoint) {
  await remoteSsh(localEndpoint, `killall -v -w /usr/sbin/xfs_growfs; fuser -v ${diskMountPoint}; umount ${diskMountPoint} && sed -i '\\_${diskMountPoint}\\S_d' /etc/fstab && rm -rf ${diskMountPoint}`)
}

async function createNewDisk (xapi, sr, vm, diskSize) {
  const newDisk = await xapi.createVdi(diskSize, {sr: sr, name_label: 'xosan_data', name_description: 'Created by XO'})
  await xapi.attachVdiToVm(newDisk, vm)
  let vbd = await xapi._waitObjectState(newDisk.$id, disk => Boolean(disk.$VBDs.length)).$VBDs[0]
  vbd = await xapi._waitObjectState(vbd.$id, vbd => Boolean(vbd.device.length))
  return '/dev/' + vbd.device
}

async function mountNewDisk (localEndpoint, hostname, newDeviceFiledeviceFile) {
  const brickRootCmd = 'bash -c \'mkdir -p /bricks; for TESTVAR in {1..9}; do TESTDIR="/bricks/xosan$TESTVAR" ;if mkdir $TESTDIR; then echo $TESTDIR; exit 0; fi ; done ; exit 1\''
  const newBrickRoot = (await remoteSsh(localEndpoint, brickRootCmd)).stdout.trim()
  const brickName = `${hostname}:${newBrickRoot}/xosandir`
  const mountBrickCmd = `mkfs.xfs -i size=512 ${newDeviceFiledeviceFile}; mkdir -p ${newBrickRoot}; echo "${newDeviceFiledeviceFile} ${newBrickRoot} xfs defaults 0 0" >> /etc/fstab; mount -a`
  await remoteSsh(localEndpoint, mountBrickCmd)
  return brickName
}

async function replaceBrickOnSameVM (xosansr, previousBrick, newLvmSr, brickSize) {
  // TODO: a bit of user input validation on 'previousBrick', it's going to ssh
  const previousIp = previousBrick.split(':')[0]
  brickSize = brickSize === undefined ? Infinity : brickSize
  const xapi = this.getXapi(xosansr)
  const data = xapi.xo.getData(xosansr, 'xosan_config')
  const nodes = data.nodes
  const nodeIndex = nodes.findIndex(node => node.vm.ip === previousIp)
  const glusterEndpoint = this::_getGlusterEndpoint(xosansr)
  const previousVM = _getIPToVMDict(xapi, xosansr)[previousBrick].vm
  const newDeviceFile = await createNewDisk(xapi, newLvmSr, previousVM, brickSize)
  const localEndpoint = {
    xapi,
    hosts: map(nodes, node => xapi.getObject(node.host)),
    addresses: [previousIp]
  }
  const previousBrickRoot = previousBrick.split(':')[1].split('/').slice(0, 3).join('/')
  const previousBrickDevice = (await remoteSsh(localEndpoint, `grep " ${previousBrickRoot} " /proc/mounts | cut -d ' ' -f 1 | sed 's_/dev/__'`)).stdout.trim()
  const brickName = await mountNewDisk(localEndpoint, previousIp, newDeviceFile)
  await glusterCmd(glusterEndpoint, `volume replace-brick xosan ${previousBrick} ${brickName} commit force`)
  nodes[nodeIndex].brickName = brickName
  nodes[nodeIndex].underlyingSr = newLvmSr
  await xapi.xo.setData(xosansr, 'xosan_config', data)
  await umountDisk(localEndpoint, previousBrickRoot)
  const previousVBD = previousVM.$VBDs.find(vbd => vbd.device === previousBrickDevice)
  await xapi.disconnectVbd(previousVBD)
  await xapi.deleteVdi(previousVBD.VDI)
  await xapi.call('SR.scan', xapi.getObject(xosansr).$ref)
}

export async function replaceBrick ({ xosansr, previousBrick, newLvmSr, brickSize, onSameVM = true }) {
  if (onSameVM) {
    return this::replaceBrickOnSameVM(xosansr, previousBrick, newLvmSr, brickSize)
  }
  // TODO: a bit of user input validation on 'previousBrick', it's going to ssh
  const previousIp = previousBrick.split(':')[0]
  brickSize = brickSize === undefined ? Infinity : brickSize
  const xapi = this.getXapi(xosansr)
  const nodes = xapi.xo.getData(xosansr, 'xosan_config').nodes
  const newIpAddress = _findAFreeIPAddress(nodes)
  const nodeIndex = nodes.findIndex(node => node.vm.ip === previousIp)
  const stayingNodes = filter(nodes, (node, index) => index !== nodeIndex)
  const glusterEndpoint = { xapi,
    hosts: map(stayingNodes, node => xapi.getObject(node.host)),
    addresses: map(stayingNodes, node => node.vm.ip) }
  const previousVMEntry = _getIPToVMDict(xapi, xosansr)[previousBrick]
  const arbiter = nodes[nodeIndex].arbiter
  let { data, newVM, addressAndHost } = await this::insertNewGlusterVm(xapi, xosansr, newLvmSr,
    {labelSuffix: arbiter ? '_arbiter' : '', glusterEndpoint, newIpAddress, increaseDataDisk: !arbiter, brickSize})
  await glusterCmd(glusterEndpoint, `volume replace-brick xosan ${previousBrick} ${addressAndHost.brickName} commit force`)
  await glusterCmd(glusterEndpoint, 'peer detach ' + previousIp)
  data.nodes.splice(nodeIndex, 1, {
    brickName: addressAndHost.brickName,
    host: addressAndHost.host.$id,
    arbiter: arbiter,
    vm: {ip: addressAndHost.address, id: newVM.$id},
    underlyingSr: newLvmSr
  })
  await xapi.xo.setData(xosansr, 'xosan_config', data)
  if (previousVMEntry) {
    await xapi.deleteVm(previousVMEntry.vm, true)
  }
  await xapi.call('SR.scan', xapi.getObject(xosansr).$ref)
}

replaceBrick.description = 'replaceBrick brick in gluster volume'
replaceBrick.permission = 'admin'
replaceBrick.params = {
  xosansr: { type: 'string' },
  previousBrick: { type: 'string' },
  newLvmSr: { type: 'string' },
  brickSize: { type: 'number' }
}

replaceBrick.resolve = {
  xosansr: ['sr', 'SR', 'administrate']
}

async function _prepareGlusterVm (xapi, lvmSr, newVM, xosanNetwork, ipAddress, {labelSuffix = '', increaseDataDisk = true,
  maxDiskSize = Infinity, memorySize = 2 * GIGABYTE}) {
  const host = lvmSr.$PBDs[0].$host
  const xenstoreData = {
    'vm-data/hostname': 'XOSAN' + lvmSr.name_label + labelSuffix,
    'vm-data/sshkey': (await getOrCreateSshKey(xapi)).public,
    'vm-data/ip': ipAddress,
    'vm-data/mtu': String(xosanNetwork.MTU),
    'vm-data/vlan': String(xosanNetwork.$PIFs[0].vlan || 0)
  }
  const ip = ipAddress
  const sr = xapi.getObject(lvmSr.$id)
  // refresh the object so that sizes are correct
  await xapi._waitObjectState(sr.$id, sr => Boolean(sr.$PBDs))
  const firstVif = newVM.$VIFs[0]
  if (xosanNetwork.$id !== firstVif.$network.$id) {
    try {
      await xapi.call('VIF.move', firstVif.$ref, xosanNetwork.$ref)
    } catch (error) {
      if (error.code === 'MESSAGE_METHOD_UNKNOWN') {
        // VIF.move has been introduced in xenserver 7.0
        await xapi.deleteVif(firstVif.$id)
        await xapi.createVif(newVM.$id, xosanNetwork.$id, firstVif)
      }
    }
  }
  await xapi.addTag(newVM.$id, `XOSAN-${xapi.pool.name_label}`)
  await xapi.editVm(newVM, {
    name_label: `XOSAN - ${lvmSr.name_label} - ${host.name_label} ${labelSuffix}`,
    name_description: 'Xosan VM storage',
    // https://bugs.xenserver.org/browse/XSO-762
    memoryMax: memorySize,
    memoryMin: memorySize,
    memoryStaticMax: memorySize,
    memory: memorySize
  })
  await xapi.call('VM.set_xenstore_data', newVM.$ref, xenstoreData)
  const rootDisk = newVM.$VBDs.map(vbd => vbd && vbd.$VDI).find(vdi => vdi && vdi.name_label === 'xosan_root')
  const rootDiskSize = rootDisk.virtual_size
  await xapi.startVm(newVM)
  debug('waiting for boot of ', ip)
  // wait until we find the assigned IP in the networks, we are just checking the boot is complete
  const vmIsUp = vm => Boolean(vm.$guest_metrics && includes(vm.$guest_metrics.networks, ip))
  const vm = await xapi._waitObjectState(newVM.$id, vmIsUp)
  debug('booted ', ip)
  const localEndpoint = {xapi: xapi, hosts: [host], addresses: [ip]}
  const srFreeSpace = sr.physical_size - sr.physical_utilisation
  // we use a percentage because it looks like the VDI overhead is proportional
  const newSize = Math.min(floor2048(Math.min(maxDiskSize - rootDiskSize, srFreeSpace * XOSAN_DATA_DISK_USEAGE_RATIO)),
    XOSAN_MAX_DISK_SIZE)
  const smallDiskSize = 1073741824
  const deviceFile = await createNewDisk(xapi, lvmSr, newVM, increaseDataDisk ? newSize : smallDiskSize)
  const brickName = await mountNewDisk(localEndpoint, ip, deviceFile)
  return { address: ip, host, vm, underlyingSr: lvmSr, brickName }
}

async function _importGlusterVM (xapi, template, lvmsrId) {
  const templateStream = await this.requestResource('xosan', template.id, template.version)
  const newVM = await xapi.importVm(templateStream, { srId: lvmsrId, type: 'xva' })
  await xapi.editVm(newVM, {
    autoPoweron: true
  })
  return newVM
}

function _findAFreeIPAddress (nodes) {
  return _findIPAddressOutsideList(map(nodes, n => n.vm.ip))
}

function _findIPAddressOutsideList (reservedList) {
  const vmIpLastNumber = 101
  for (let i = vmIpLastNumber; i < 255; i++) {
    const candidate = NETWORK_PREFIX + i
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

const insertNewGlusterVm = defer.onFailure(async function ($onFailure, xapi, xosansr, lvmsrId, {labelSuffix = '',
  glusterEndpoint = null, ipAddress = null, increaseDataDisk = true, brickSize = Infinity}) {
  const data = xapi.xo.getData(xosansr, 'xosan_config')
  if (ipAddress === null) {
    ipAddress = _findAFreeIPAddress(data.nodes)
  }
  const vmsMemories = []
  for (let node of data.nodes) {
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
  $onFailure(() => xapi.deleteVm(newVM, true))
  const addressAndHost = await _prepareGlusterVm(xapi, srObject, newVM, xosanNetwork, ipAddress, {labelSuffix,
    increaseDataDisk,
    maxDiskSize: brickSize,
    memorySize: vmsMemories.length ? _median(vmsMemories) : 2 * GIGABYTE})
  if (!glusterEndpoint) {
    glusterEndpoint = this::_getGlusterEndpoint(xosansr)
  }
  await _probePoolAndWaitForPresence(glusterEndpoint, [addressAndHost.address])
  return { data, newVM, addressAndHost, glusterEndpoint }
})

export const addBricks = defer.onFailure(async function ($onFailure, {xosansr, lvmsrs, brickSize}) {
  const xapi = this.getXapi(xosansr)
  if (CURRENTLY_CREATING_SRS[xapi.pool.$id]) {
    throw new Error('createSR is already running for this pool')
  }
  CURRENTLY_CREATING_SRS[xapi.pool.$id] = true
  try {
    const data = xapi.xo.getData(xosansr, 'xosan_config')
    const usedAddresses = map(data.nodes, n => n.vm.ip)
    const glusterEndpoint = this::_getGlusterEndpoint(xosansr)
    const newAddresses = []
    const newNodes = []
    for (let newSr of lvmsrs) {
      const ipAddress = _findIPAddressOutsideList(usedAddresses.concat(newAddresses))
      newAddresses.push(ipAddress)
      const {newVM, addressAndHost} = await this::insertNewGlusterVm(xapi, xosansr, newSr, { ipAddress, brickSize })
      $onFailure(() => glusterCmd(glusterEndpoint, 'peer detach ' + ipAddress, true))
      $onFailure(() => xapi.deleteVm(newVM, true))
      const brickName = addressAndHost.brickName
      newNodes.push({brickName, host: addressAndHost.host.$id, vm: {id: newVM.$id, ip: ipAddress}, underlyingSr: newSr})
    }
    const arbiterNode = data.nodes.find(n => n['arbiter'])
    if (arbiterNode) {
      await glusterCmd(glusterEndpoint,
        `volume remove-brick xosan replica ${data.nodes.length - 1} ${arbiterNode.brickName} force`)
      data.nodes = data.nodes.filter(n => n !== arbiterNode)
      data.type = 'replica'
      await xapi.xo.setData(xosansr, 'xosan_config', data)
      await glusterCmd(glusterEndpoint, 'peer detach ' + arbiterNode.vm.ip, true)
      await xapi.deleteVm(arbiterNode.vm.id, true)
    }
    await glusterCmd(glusterEndpoint, `volume add-brick xosan ${newNodes.map(n => n.brickName).join(' ')}`)
    data.nodes = data.nodes.concat(newNodes)
    await xapi.xo.setData(xosansr, 'xosan_config', data)
    await xapi.call('SR.scan', xapi.getObject(xosansr).$ref)
  } finally {
    delete CURRENTLY_CREATING_SRS[xapi.pool.$id]
  }
})

addBricks.description = 'add brick to XOSAN SR'
addBricks.permission = 'admin'
addBricks.params = {
  xosansr: { type: 'string' },
  lvmsrs: {
    type: 'array',
    items: {
      type: 'string'
    } },
  brickSize: {type: 'number'}
}

addBricks.resolve = {
  xosansr: ['sr', 'SR', 'administrate'],
  lvmsrs: ['sr', 'SR', 'administrate']
}

export const removeBricks = defer.onFailure(async function ($onFailure, { xosansr, bricks }) {
  const xapi = this.getXapi(xosansr)
  if (CURRENTLY_CREATING_SRS[xapi.pool.$id]) {
    throw new Error('this there is already a XOSAN operation running on this pool')
  }
  CURRENTLY_CREATING_SRS[xapi.pool.$id] = true
  try {
    const data = xapi.xo.getData(xosansr, 'xosan_config')
    // IPV6
    const ips = map(bricks, b => b.split(':')[0])
    const glusterEndpoint = this::_getGlusterEndpoint(xosansr)
    // "peer detach" doesn't allow removal of locahost
    remove(glusterEndpoint.addresses, ip => ips.includes(ip))
    const dict = _getIPToVMDict(xapi, xosansr)
    const brickVMs = map(bricks, b => dict[b])
    await glusterCmd(glusterEndpoint, `volume remove-brick xosan ${bricks.join(' ')} force`)
    await asyncMap(ips, ip => glusterCmd(glusterEndpoint, 'peer detach ' + ip, true))
    remove(data.nodes, node => ips.includes(node.vm.ip))
    await xapi.xo.setData(xosansr, 'xosan_config', data)
    await xapi.call('SR.scan', xapi.getObject(xosansr).$ref)
    await asyncMap(brickVMs, vm => xapi.deleteVm(vm.vm, true))
  } finally {
    delete CURRENTLY_CREATING_SRS[xapi.pool.$id]
  }
})

removeBricks.description = 'remove brick from XOSAN SR'
removeBricks.permission = 'admin'
removeBricks.params = {
  xosansr: { type: 'string' },
  bricks: {
    type: 'array',
    items: { type: 'string' }
  }
}

export function checkSrIsBusy ({ poolId }) {
  return !!CURRENTLY_CREATING_SRS[poolId]
}
checkSrIsBusy.description = 'checks if there is a xosan SR curently being created on the given pool id'
checkSrIsBusy.permission = 'admin'
checkSrIsBusy.params = { poolId: { type: 'string' } }

const POSSIBLE_CONFIGURATIONS = {}
POSSIBLE_CONFIGURATIONS[2] = [{ layout: 'replica_arbiter', redundancy: 3, capacity: 1 }]
POSSIBLE_CONFIGURATIONS[3] = [
  { layout: 'disperse', redundancy: 1, capacity: 2 },
  { layout: 'replica', redundancy: 3, capacity: 1 }]
POSSIBLE_CONFIGURATIONS[4] = [{ layout: 'replica', redundancy: 2, capacity: 2 }]
POSSIBLE_CONFIGURATIONS[5] = [{ layout: 'disperse', redundancy: 1, capacity: 4 }]
POSSIBLE_CONFIGURATIONS[6] = [
  { layout: 'disperse', redundancy: 2, capacity: 4 },
  { layout: 'replica', redundancy: 2, capacity: 3 },
  { layout: 'replica', redundancy: 3, capacity: 2 }]
POSSIBLE_CONFIGURATIONS[7] = [{ layout: 'disperse', redundancy: 3, capacity: 4 }]
POSSIBLE_CONFIGURATIONS[8] = [{ layout: 'replica', redundancy: 2, capacity: 4 }]
POSSIBLE_CONFIGURATIONS[9] = [
  { layout: 'disperse', redundancy: 1, capacity: 8 },
  { layout: 'replica', redundancy: 3, capacity: 3 }]
POSSIBLE_CONFIGURATIONS[10] = [
  { layout: 'disperse', redundancy: 2, capacity: 8 },
  { layout: 'replica', redundancy: 2, capacity: 5 }]
POSSIBLE_CONFIGURATIONS[11] = [{ layout: 'disperse', redundancy: 3, capacity: 8 }]
POSSIBLE_CONFIGURATIONS[12] = [
  { layout: 'disperse', redundancy: 4, capacity: 8 },
  { layout: 'replica', redundancy: 2, capacity: 6 }]
POSSIBLE_CONFIGURATIONS[13] = [{ layout: 'disperse', redundancy: 5, capacity: 8 }]
POSSIBLE_CONFIGURATIONS[14] = [
  { layout: 'disperse', redundancy: 6, capacity: 8 },
  { layout: 'replica', redundancy: 2, capacity: 7 }]
POSSIBLE_CONFIGURATIONS[15] = [
  { layout: 'disperse', redundancy: 7, capacity: 8 },
  { layout: 'replica', redundancy: 3, capacity: 5 }]
POSSIBLE_CONFIGURATIONS[16] = [{ layout: 'replica', redundancy: 2, capacity: 8 }]

export async function computeXosanPossibleOptions ({ lvmSrs, brickSize }) {
  const count = lvmSrs.length
  const configurations = POSSIBLE_CONFIGURATIONS[count]
  if (!configurations) {
    return null
  }
  if (count > 0) {
    const xapi = this.getXapi(lvmSrs[0])
    const srs = map(lvmSrs, srId => xapi.getObject(srId))
    const srSizes = map(srs, sr => sr.physical_size - sr.physical_utilisation)
    const minSize = Math.min.apply(null, srSizes.concat(brickSize))
    const finalBrickSize = Math.floor((minSize - XOSAN_VM_SYSTEM_DISK_SIZE) * XOSAN_DATA_DISK_USEAGE_RATIO)
    return configurations.map(conf => ({ ...conf, availableSpace: finalBrickSize * conf.capacity }))
  }
}

computeXosanPossibleOptions.params = {
  lvmSrs: {
    type: 'array',
    items: {
      type: 'string'
    }
  },
  brickSize: {
    type: 'number'
  }
}

// ---------------------------------------------------------------------

export async function downloadAndInstallXosanPack ({ id, version, pool }) {
  if (!this.requestResource) {
    throw new Error('requestResource is not a function')
  }

  const xapi = this.getXapi(pool.id)
  const res = await this.requestResource('xosan', id, version)

  await xapi.installSupplementalPackOnAllHosts(res)
  await xapi._updateObjectMapProperty(xapi.pool, 'other_config', {
    'xosan_pack_installation_time': String(Math.floor(Date.now() / 1e3))
  })
}

downloadAndInstallXosanPack.description = 'Register a resource via cloud plugin'

downloadAndInstallXosanPack.params = {
  id: { type: 'string' },
  version: { type: 'string' },
  pool: { type: 'string' }
}

downloadAndInstallXosanPack.resolve = {
  pool: ['pool', 'pool', 'administrate']
}

downloadAndInstallXosanPack.permission = 'admin'
