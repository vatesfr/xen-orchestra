/* eslint eslint-comments/disable-enable-pair: [error, {allowWholeFile: true}] */
/* eslint-disable camelcase */
import asyncMapSettled from '@xen-orchestra/async-map/legacy.js'
import fatfs from 'fatfs'
import filter from 'lodash/filter.js'
import find from 'lodash/find.js'
import flatMap from 'lodash/flatMap.js'
import flatten from 'lodash/flatten.js'
import isEmpty from 'lodash/isEmpty.js'
import keyBy from 'lodash/keyBy.js'
import mapToArray from 'lodash/map.js'
import mixin from '@xen-orchestra/mixin/legacy.js'
import ms from 'ms'
import noop from 'lodash/noop.js'
import once from 'lodash/once.js'
import pick from 'lodash/pick.js'
import tarStream from 'tar-stream'
import uniq from 'lodash/uniq.js'
import { asyncMap } from '@xen-orchestra/async-map'
import { vmdkToVhd, vhdToVMDK, writeOvaOn } from 'xo-vmdk-to-vhd'
import { cancelable, CancelToken, fromEvents, ignoreErrors, pRetry } from 'promise-toolbox'
import { createLogger } from '@xen-orchestra/log'
import { decorateWith } from '@vates/decorate-with'
import { defer as deferrable } from 'golike-defer'
import { limitConcurrency } from 'limit-concurrency-decorator'
import { parseDuration } from '@vates/parse-duration'
import { PassThrough, pipeline } from 'stream'
import { forbiddenOperation, operationFailed } from 'xo-common/api-errors.js'
import { parseDateTime, Xapi as XapiBase } from '@xen-orchestra/xapi'
import { Ref } from 'xen-api'
import { synchronized } from 'decorator-synchronized'

import fatfsBuffer, { addMbr, init as fatfsBufferInit } from '../fatfs-buffer.mjs'
import { camelToSnakeCase, forEach, map, pDelay, promisifyAll } from '../utils.mjs'
import { debounceWithKey } from '../_pDebounceWithKey.mjs'

import mixins from './mixins/index.mjs'
import OTHER_CONFIG_TEMPLATE from './other-config-template.mjs'
import { asInteger, canSrHaveNewVdiOfSize, isVmHvm, isVmRunning, prepareXapiParam } from './utils.mjs'

const log = createLogger('xo:xapi')

class AggregateError extends Error {
  constructor(errors, message) {
    super(message)
    this.errors = errors
  }
}

// ===================================================================

export * from './utils.mjs'

// VDI formats. (Raw is not available for delta vdi.)
export const VDI_FORMAT_VHD = 'vhd'
export const VDI_FORMAT_RAW = 'raw'

export const IPV4_CONFIG_MODES = ['None', 'DHCP', 'Static']
export const IPV6_CONFIG_MODES = ['None', 'DHCP', 'Static', 'Autoconf']

// ===================================================================

@mixin(Object.values(mixins))
export default class Xapi extends XapiBase {
  constructor({
    guessVhdSizeOnImport,
    maxUncoalescedVdis,
    restartHostTimeout,
    vdiExportConcurrency,
    vmEvacuationConcurrency,
    vmExportConcurrency,
    vmMigrationConcurrency = 3,
    vmSnapshotConcurrency,
    ...opts
  }) {
    super(opts)

    this._guessVhdSizeOnImport = guessVhdSizeOnImport
    this._maxUncoalescedVdis = maxUncoalescedVdis
    this._restartHostTimeout = parseDuration(restartHostTimeout)
    this._vmEvacuationConcurrency = vmEvacuationConcurrency

    //  close event is emitted when the export is canceled via browser. See https://github.com/vatesfr/xen-orchestra/issues/5535
    const waitStreamEnd = async stream => fromEvents(await stream, ['end', 'close'])
    this.VDI_exportContent = limitConcurrency(vdiExportConcurrency, waitStreamEnd)(this.VDI_exportContent)
    this.VM_export = limitConcurrency(vmExportConcurrency, waitStreamEnd)(this.VM_export)

    this._migrateVmWithStorageMotion = limitConcurrency(vmMigrationConcurrency)(this._migrateVmWithStorageMotion)
    this.VM_snapshot = limitConcurrency(vmSnapshotConcurrency)(this.VM_snapshot)

    // Patch getObject to resolve _xapiId property.
    this.getObject = (
      getObject =>
      (...args) => {
        let tmp
        if ((tmp = args[0]) != null && (tmp = tmp._xapiId) != null) {
          args[0] = tmp
        }
        return getObject.apply(this, args)
      }
    )(this.getObject)
  }

  // Wait for an object to be in a given state.
  //
  // Faster than waitObject() with a function.
  async _waitObjectState(idOrUuidOrRef, predicate) {
    const object = this.getObject(idOrUuidOrRef, null)
    if (object && predicate(object)) {
      return object
    }

    const loop = () => this.waitObject(idOrUuidOrRef).then(object => (predicate(object) ? object : loop()))

    return loop()
  }

  // Returns the objects if already presents or waits for it.
  async _getOrWaitObject(idOrUuidOrRef) {
    return this.getObject(idOrUuidOrRef, null) || this.waitObject(idOrUuidOrRef)
  }

  // =================================================================

  _setObjectProperties(object, props) {
    const { $ref: ref, $type: type } = object

    // TODO: the thrown error should contain the name of the
    // properties that failed to be set.
    return Promise.all(
      mapToArray(props, (value, name) => {
        if (value != null) {
          return this.call(`${type}.set_${camelToSnakeCase(name)}`, ref, prepareXapiParam(value))
        }
      })
    )::ignoreErrors()
  }

  // =================================================================

  setDefaultSr(srId) {
    return this.pool.set_default_SR(this.getObject(srId).$ref)
  }

  // =================================================================

  async setPoolMaster(hostId) {
    await this.call('pool.designate_new_master', this.getObject(hostId).$ref)
  }

  // =================================================================

  async disableHa() {
    await this.call('pool.disable_ha')
  }

  // =================================================================

  async enableHa(heartbeatSrs, configuration) {
    await this.call(
      'pool.enable_ha',
      heartbeatSrs.map(srId => this.getObject(srId).$ref),
      configuration
    )
  }

  // =================================================================

  async joinPool(masterAddress, masterUsername, masterPassword, force = false) {
    try {
      await this.call(force ? 'pool.join_force' : 'pool.join', masterAddress, masterUsername, masterPassword)
    } catch (error) {
      const params = error?.call?.params
      if (Array.isArray(params)) {
        params[2] = '* obfuscated *'
      }
      throw error
    }
  }

  // =================================================================

  async emergencyShutdownHost(hostId) {
    const host = this.getObject(hostId)
    log.debug(`Emergency shutdown: ${host.name_label}`)

    await this.call('host.disable', host.$ref)

    await asyncMap(host.$resident_VMs, vm => {
      if (!vm.is_control_domain) {
        return ignoreErrors.call(this.callAsync('VM.suspend', vm.$ref))
      }
    })

    await this.callAsync('host.shutdown', host.$ref)
  }

  // =================================================================

  // Disable the host and evacuate all its VMs.
  //
  // If `force` is false and the evacuation failed, the host is re-
  // enabled and the error is thrown.
  async clearHost({ $ref: hostRef, $pool: pool }, force) {
    await this.call('host.disable', hostRef)

    const migrationNetworkRef = (id => {
      if (id !== undefined) {
        const network = this.getObject(id, undefined)
        if (network === undefined) {
          throw new Error('could not find migration network ' + id)
        }
        return network.$ref
      }
    })(pool.other_config['xo:migrationNetwork'])

    // host ref
    // migration network: optional and might not be supported
    // batch size: optional and might not be supported
    const params = [hostRef, migrationNetworkRef ?? Ref.EMPTY, this._vmEvacuationConcurrency]

    // Removes n params from the end and keeps removing until a non-empty param is found
    const popParamsAndTrim = (n = 0) => {
      let last
      let i = 0
      while (i < n || (last = params[params.length - 1]) === undefined || last === Ref.EMPTY) {
        if (params.length <= 1) {
          throw new Error('not enough params left')
        }
        params.pop()
        i++
      }
    }

    popParamsAndTrim()

    try {
      await pRetry(() => this.callAsync('host.evacuate', ...params), {
        delay: 0,
        when: { code: 'MESSAGE_PARAMETER_COUNT_MISMATCH' },
        onRetry: error => {
          log.warn(error)
          popParamsAndTrim(1)
        },
      })
    } catch (error) {
      if (!force) {
        await this.call('host.enable', hostRef)

        throw error
      }
    }
  }

  async disableHost(hostId) {
    await this.call('host.disable', this.getObject(hostId).$ref)
  }

  async forgetHost(hostId) {
    await this.callAsync('host.destroy', this.getObject(hostId).$ref)
  }

  async ejectHostFromPool(hostId) {
    await this.call('pool.eject', this.getObject(hostId).$ref)
  }

  async enableHost(hostId) {
    await this.call('host.enable', this.getObject(hostId).$ref)
  }

  async installCertificateOnHost(hostId, { certificate, chain = '', privateKey }) {
    try {
      await this.call('host.install_server_certificate', this.getObject(hostId).$ref, certificate, privateKey, chain)
    } catch (error) {
      // CH/XCP-ng reset the connection on the certificate install
      if (error.code !== 'ECONNRESET') {
        throw error
      }
    }
  }

  // Resources:
  // - Citrix XenServer ® 7.0 Administrator's Guide ch. 5.4
  // - https://github.com/xcp-ng/xenadmin/blob/60dd70fc36faa0ec91654ec97e24b7af36acff9f/XenModel/Actions/Host/EditMultipathAction.cs
  // - https://github.com/serencorbett1/xenadmin/blob/1c3fb0c1112e4e316423afc6a028066001d3dea1/XenModel/XenAPI-Extensions/SR.cs
  @decorateWith(deferrable.onError(log.warn))
  async setHostMultipathing($defer, hostId, multipathing) {
    const host = this.getObject(hostId)

    if (host.enabled) {
      await this.disableHost(hostId)
      $defer(() => this.enableHost(hostId))
    }

    // Xen center evacuate running VMs before unplugging the PBDs.
    // The evacuate method uses the live migration to migrate running VMs
    // from host to another. It only works when a shared SR is present
    // in the host. For this reason we chose to show a warning instead.
    const pluggedPbds = host.$PBDs.filter(pbd => pbd.currently_attached)
    await asyncMapSettled(pluggedPbds, async pbd => {
      const ref = pbd.$ref
      await this.unplugPbd(ref)
      $defer(() => this.plugPbd(ref))
    })

    return host.update_other_config(
      multipathing
        ? {
            multipathing: 'true',
            multipathhandle: 'dmp',
          }
        : {
            multipathing: 'false',
          }
    )
  }

  async powerOnHost(hostId) {
    await this.callAsync('host.power_on', this.getObject(hostId).$ref)
  }

  async rebootHost(hostId, force = false) {
    const host = this.getObject(hostId)

    await this.clearHost(host, force)
    await this.callAsync('host.reboot', host.$ref)
  }

  async setRemoteSyslogHost(hostId, syslogDestination) {
    const host = this.getObject(hostId)
    await host.set_logging({
      syslog_destination: syslogDestination,
    })
    await this.call('host.syslog_reconfigure', host.$ref)
  }

  async shutdownHost(hostId, { force = false, bypassEvacuate = false } = {}) {
    const host = this.getObject(hostId)
    if (bypassEvacuate) {
      await this.call('host.disable', host.$ref)
    } else {
      await this.clearHost(host, force)
    }
    await this.callAsync('host.shutdown', host.$ref)
  }

  // =================================================================

  // Clone a VM: make a fast copy by fast copying each of its VDIs
  // (using snapshots where possible) on the same SRs.
  _cloneVm(vm, nameLabel = vm.name_label) {
    log.debug(`Cloning VM ${vm.name_label}${nameLabel !== vm.name_label ? ` as ${nameLabel}` : ''}`)

    return this.callAsync('VM.clone', vm.$ref, nameLabel)
  }

  // Copy a VM: make a normal copy of a VM and all its VDIs.
  //
  // If a SR is specified, it will contains the copies of the VDIs,
  // otherwise they will use the SRs they are on.
  async _copyVm(vm, nameLabel = vm.name_label, sr = undefined) {
    let snapshotRef
    if (isVmRunning(vm)) {
      snapshotRef = await this.VM_snapshot(vm.$ref)
    }

    log.debug(
      `Copying VM ${vm.name_label}${nameLabel !== vm.name_label ? ` as ${nameLabel}` : ''}${
        sr ? ` on ${sr.name_label}` : ''
      }`
    )

    try {
      return await this.callAsync('VM.copy', snapshotRef || vm.$ref, nameLabel, sr ? sr.$ref : '')
    } finally {
      if (snapshotRef) {
        await this.VM_destroy(snapshotRef)
      }
    }
  }

  async cloneVm(vmId, { nameLabel = undefined, fast = true } = {}) {
    const vm = this.getObject(vmId)

    const cloneRef = await (fast ? this._cloneVm(vm, nameLabel) : this._copyVm(vm, nameLabel))

    return /* await */ this._getOrWaitObject(cloneRef)
  }

  async copyVm(vmId, { nameLabel = undefined, srOrSrId = undefined } = {}) {
    return /* await */ this._getOrWaitObject(
      await this._copyVm(this.getObject(vmId), nameLabel, srOrSrId !== undefined ? this.getObject(srOrSrId) : undefined)
    )
  }

  async remoteCopyVm(vmId, targetXapi, targetSrId, { compress, nameLabel = undefined } = {}) {
    // Fall back on local copy if possible.
    if (targetXapi === this) {
      return {
        vm: await this.copyVm(vmId, { nameLabel, srOrSrId: targetSrId }),
      }
    }

    const sr = targetXapi.getObject(targetSrId)
    const stream = (
      await this.VM_export(this.getObject(vmId).$ref, {
        compress,
      })
    ).body

    const onVmCreation = nameLabel !== undefined ? vm => vm.set_name_label(nameLabel) : null

    const vm = await targetXapi._getOrWaitObject(await targetXapi.VM_import(stream, sr.$ref, onVmCreation))

    return {
      vm,
    }
  }

  getVmConsole(vmId) {
    const vm = this.getObject(vmId)

    if (vm.other_config.disable_pv_vnc === '1') {
      throw new Error('console is disabled for this VM')
    }

    const console = find(vm.$consoles, { protocol: 'rfb' })
    if (!console) {
      throw new Error('no RFB console found')
    }

    return console
  }

  @cancelable
  async exportVmOva($cancelToken, vmRef) {
    const vm = this.getObject(vmRef)
    const useSnapshot = isVmRunning(vm)
    let exportedVm
    if (useSnapshot) {
      const snapshotRef = await this.VM_snapshot(vmRef, {
        name_label: vm.name_label,
        cancelToken: $cancelToken,
      })
      exportedVm = this.getObject(snapshotRef)
    } else {
      exportedVm = vm
    }

    const collectedDisks = []
    for (const blockDevice of exportedVm.$VBDs) {
      if (blockDevice.type === 'Disk') {
        const vdi = blockDevice.$VDI
        collectedDisks.push({
          getStream: () => {
            return vdi.$exportContent({ cancelToken: $cancelToken, format: VDI_FORMAT_VHD })
          },
          name: vdi.name_label,
          fileName: vdi.name_label + '.vmdk',
          description: vdi.name_description,
          capacityMB: Math.ceil(vdi.virtual_size / 1024 / 1024),
        })
      }
    }
    const nics = []
    for (const vif of exportedVm.$VIFs) {
      nics.push({
        macAddress: vif.MAC_autogenerated ? '' : vif.MAC,
        networkName: this.getObject(vif.network).name_label,
      })
    }

    const writeStream = new PassThrough()
    writeOvaOn(writeStream, {
      disks: collectedDisks,
      vmName: exportedVm.name_label,
      vmDescription: exportedVm.name_description,
      cpuCount: exportedVm.VCPUs_at_startup,
      vmMemoryMB: Math.ceil(exportedVm.memory_dynamic_max / 1024 / 1024),
      firmware: exportedVm.HVM_boot_params.firmware,
      nics,
    })

    writeStream.statusCode = 200
    writeStream.headers = { 'content-type': 'application/ova' }
    writeStream.statusMessage = 'OK'

    let destroyed = false
    const destroySnapshot = () => {
      if (useSnapshot && !destroyed) {
        destroyed = true
        this.VM_destroy(exportedVm.$ref)::ignoreErrors()
      }
    }
    writeStream.cancel = () => {
      destroySnapshot()
      return writeStream.destroy()
    }
    writeStream.once('end', destroySnapshot)
    writeStream.once('error', destroySnapshot)
    return writeStream
  }

  async _migrateVmWithStorageMotion(
    vm,
    hostXapi,
    host,
    {
      migrationNetwork = find(host.$PIFs, pif => pif.management).$network, // TODO: handle not found
      sr,
      mapVdisSrs = {},
      mapVifsNetworks,
      force = false,
      bypassAssert = false,
    }
  ) {
    const srRef = sr !== undefined ? hostXapi.getObject(sr).$ref : undefined
    const getDefaultSrRef = once(() => {
      const defaultSr = host.$pool.$default_SR
      if (defaultSr === undefined) {
        throw new Error(`This operation requires a default SR to be set on the pool ${host.$pool.name_label}`)
      }
      return defaultSr.$ref
    })

    // VDIs/SRs mapping
    // For VDI:
    // - If a map of VDI -> SR was explicitly passed: use it
    // - Else if SR was explicitly passed: use it
    // - Else if VDI SR is reachable from the destination host: use it
    // - Else: use the migration main SR or the pool's default SR (error if none of them is defined)
    function getMigrationSrRef(vdi) {
      if (mapVdisSrs[vdi.$id] !== undefined) {
        return hostXapi.getObject(mapVdisSrs[vdi.$id]).$ref
      }

      if (srRef !== undefined) {
        return srRef
      }

      if (isSrConnected(vdi.$SR)) {
        return vdi.$SR.$ref
      }

      return getDefaultSrRef()
    }

    const hostPbds = new Set(host.PBDs)
    const connectedSrs = new Map()
    const isSrConnected = sr => {
      let isConnected = connectedSrs.get(sr.$ref)
      if (isConnected === undefined) {
        isConnected = sr.PBDs.some(ref => hostPbds.has(ref))
        connectedSrs.set(sr.$ref, isConnected)
      }
      return isConnected
    }

    // VDIs/SRs mapping
    // For VDI-snapshot:
    // - If VDI-snapshot is an orphan snapshot: same logic as a VDI
    // - Else: don't add it to the map (VDI -> SR). It will be managed by the XAPI (snapshot will be migrated to the same SR as its parent active VDI)
    const vdis = {}
    const vbds = flatMap(vm.$snapshots, '$VBDs').concat(vm.$VBDs)
    for (const vbd of vbds) {
      if (vbd.type === 'Disk') {
        const vdi = vbd.$VDI
        // Ignore VDI snapshots which have a parent
        if (vdi.$snapshot_of !== undefined) {
          continue
        }
        vdis[vdi.$ref] = getMigrationSrRef(vdi)
      }
    }

    // VIFs/Networks mapping
    const vifsMap = {}
    if (vm.$pool !== host.$pool) {
      const defaultNetworkRef = find(host.$PIFs, pif => pif.management).$network.$ref
      // Add snapshots' VIFs which VM has no VIFs on these devices
      const vmVifs = vm.$VIFs
      const vifDevices = new Set(vmVifs.map(_ => _.device))
      const vifs = flatMap(vm.$snapshots, '$VIFs')
        .filter(vif => !vifDevices.has(vif.device))
        .concat(vmVifs)
      for (const vif of vifs) {
        vifsMap[vif.$ref] =
          mapVifsNetworks && mapVifsNetworks[vif.$id]
            ? hostXapi.getObject(mapVifsNetworks[vif.$id]).$ref
            : defaultNetworkRef
      }
    }

    const params = [
      vm.$ref,
      await hostXapi.call('host.migrate_receive', host.$ref, migrationNetwork.$ref, {}), // token
      true, // Live migration.
      vdis,
      vifsMap,
      {
        force: force ? 'true' : 'false',
      },
      // FIXME: missing param `vgu_map`, it does not cause issues ATM but it
      // might need to be changed one day.
      // {},
    ]

    if (!bypassAssert) {
      try {
        await this.callAsync('VM.assert_can_migrate', ...params)
      } catch (err) {
        if (err.code !== 'VDI_CBT_ENABLED') {
          // cbt disabling is handled later, by the migrate_end call
          throw err
        }
      }
    }
    const loop = async (_failOnCbtError = false) => {
      try {
        await this.callAsync('VM.migrate_send', ...params)
      } catch (err) {
        if (err.code === 'VDI_CBT_ENABLED' && !_failOnCbtError) {
          // as of 20240619, CBT must be disabled on all disks to allow migration to go through
          // it will be re enabled if needed by backups
          // the next backup after a storage migration will be a full backup
          await this.VM_disableChangedBlockTracking(vm.$ref)
          return loop(true)
        }
        if (err.code === 'TOO_MANY_STORAGE_MIGRATES') {
          await pDelay(1e4)
          return loop()
        }
        throw err
      }
    }
    return loop().then(noop)
  }

  @synchronized()
  _callInstallationPlugin(hostRef, vdi) {
    return this.call('host.call_plugin', hostRef, 'install-supp-pack', 'install', { vdi }).catch(error => {
      if (error.code !== 'XENAPI_PLUGIN_FAILURE' || !error.params?.[2]?.includes?.('UPDATE_ALREADY_APPLIED')) {
        throw error
      }
      log.warn('_callInstallationPlugin', { error })
    })
  }

  @decorateWith(deferrable)
  async installSupplementalPack($defer, stream, { hostId }) {
    if (!stream.length) {
      throw new Error('stream must have a length')
    }

    const vdi = await this.createTemporaryVdiOnHost(
      stream,
      hostId,
      '[XO] Supplemental pack ISO',
      'small temporary VDI to store a supplemental pack ISO'
    )
    $defer(() => vdi.$destroy())

    await this._callInstallationPlugin(this.getObject(hostId).$ref, vdi.uuid)
  }

  @decorateWith(deferrable)
  async installSupplementalPackOnAllHosts($defer, stream) {
    if (!stream.length) {
      throw new Error('stream must have a length')
    }

    const isSrAvailable = sr =>
      sr && sr.content_type === 'user' && sr.physical_size - sr.physical_utilisation >= stream.length

    const hosts = filter(this.objects.all, { $type: 'host' })

    const sr = this.findAvailableSharedSr(stream.length)

    // Shared SR available: create only 1 VDI for all the installations
    if (sr) {
      const vdi = await this.createTemporaryVdiOnSr(
        stream,
        sr,
        '[XO] Supplemental pack ISO',
        'small temporary VDI to store a supplemental pack ISO'
      )
      $defer(() => vdi.$destroy())

      // Install pack sequentially to prevent concurrent access to the unique VDI
      for (const host of hosts) {
        await this._callInstallationPlugin(host.$ref, vdi.uuid)
      }

      return
    }

    // No shared SR available: find an available local SR on each host
    return Promise.all(
      hosts.map(
        deferrable(async ($defer, host) => {
          // pipe stream synchronously to several PassThroughs to be able to pipe them asynchronously later
          const pt = stream.pipe(new PassThrough())
          pt.length = stream.length

          const sr = find(
            host.$PBDs.map(_ => _.$SR),
            isSrAvailable
          )

          if (!sr) {
            throw new Error('no SR available to store installation file')
          }

          const vdi = await this.createTemporaryVdiOnSr(
            pt,
            sr,
            '[XO] Supplemental pack ISO',
            'small temporary VDI to store a supplemental pack ISO'
          )
          $defer(() => vdi.$destroy())

          await this._callInstallationPlugin(host.$ref, vdi.uuid)
        })
      )
    )
  }

  @decorateWith(deferrable)
  async _importOvaVm($defer, stream, { descriptionLabel, disks, memory, nameLabel, networks, nCpus, tables }, sr) {
    // 1. Create VM.
    const vm = await this._getOrWaitObject(
      await this.VM_create({
        ...OTHER_CONFIG_TEMPLATE,
        memory_dynamic_max: memory,
        memory_dynamic_min: memory,
        memory_static_max: memory,
        memory_static_min: memory,
        name_description: descriptionLabel,
        name_label: nameLabel,
        VCPUs_at_startup: nCpus,
        VCPUs_max: nCpus,
      })
    )
    $defer.onFailure(() => this.VM_destroy(vm.$ref))
    // Disable start and change the VM name label during import.
    await Promise.all([
      asyncMapSettled(['start', 'start_on'], op => vm.update_blocked_operations(op, 'OVA import in progress...')),
      vm.set_name_label(`[Importing...] ${nameLabel}`),
    ])

    // 2. Create VDIs & Vifs.
    const vdis = {}
    const compression = {}
    const vifDevices = await this.call('VM.get_allowed_VIF_devices', vm.$ref)
    if (networks.length > vifDevices.length) {
      throw operationFailed({ objectId: vm.id, code: 'TOO_MANY_VIFs' })
    }
    await Promise.all(
      map(networks, (networkId, i) =>
        this.VIF_create({
          device: vifDevices[i],
          network: this.getObject(networkId).$ref,
          VM: vm.$ref,
        })
      )
    )

    // 3. Import VDIs contents.
    await new Promise((resolve, reject) => {
      const extract = tarStream.extract()

      stream.on('error', reject)

      extract.on('finish', resolve)
      extract.on('error', reject)
      extract.on('entry', async (entry, stream, cb) => {
        const diskMetadata = disks.find(({ path }) => path === entry.name)
        // Not a disk to import
        if (!diskMetadata) {
          stream.on('end', cb)
          stream.resume()
          return
        }
        const nodeStream = new PassThrough()
        pipeline(stream, nodeStream, () => {})
        const table = tables[entry.name]
        const vhdStream = await vmdkToVhd(
          nodeStream, // tar-stream stream are not node stream
          table.grainLogicalAddressList,
          table.grainFileOffsetList,
          compression[entry.name] === 'gzip',
          entry.size
        )

        try {
          // vmdk size can be wrong in ova
          // we use the size ine the vmdk descriptor to create the vdi
          const vdi = (vdis[diskMetadata.path] = await this._getOrWaitObject(
            await this.VDI_create({
              name_description: diskMetadata.descriptionLabel,
              name_label: diskMetadata.nameLabel,
              SR: sr.$ref,
              virtual_size: vhdStream._rawLength,
            })
          ))
          $defer.onFailure(() => vdi.$destroy())
          compression[diskMetadata.path] = diskMetadata.compression
          await this.VBD_create({
            userdevice: String(diskMetadata.position),
            VDI: vdi.$ref,
            VM: vm.$ref,
          })

          await vdi.$importContent(vhdStream, { format: VDI_FORMAT_VHD })
          // See: https://github.com/mafintosh/tar-stream#extracting
          // No import parallelization.
        } catch (e) {
          reject(e)
        } finally {
          cb()
        }
      })
      stream.pipe(extract)
    })

    // Enable start and restore the VM name label after import.
    await Promise.all([vm.update_blocked_operations({ start: null, start_on: null }), vm.set_name_label(nameLabel)])
    return vm
  }

  // TODO: an XVA can contain multiple VMs
  async importVm(stream, { data, srId, type = 'xva' } = {}) {
    const sr = srId && this.getObject(srId)

    if (type === 'xva') {
      return /* await */ this._getOrWaitObject(await this.VM_import(stream, sr?.$ref))
    }

    if (type === 'ova') {
      return this._getOrWaitObject(await this._importOvaVm(stream, data, sr))
    }

    throw new Error(`unsupported type: '${type}'`)
  }

  async migrateVm(
    vmId,
    hostXapi,
    hostId,
    { force = false, mapVdisSrs, mapVifsNetworks, migrationNetworkId, sr, bypassAssert } = {}
  ) {
    const vm = this.getObject(vmId)
    const host = hostXapi.getObject(hostId)

    const accrossPools = vm.$pool !== host.$pool
    const useStorageMotion =
      accrossPools ||
      sr !== undefined ||
      migrationNetworkId !== undefined ||
      !isEmpty(mapVifsNetworks) ||
      !isEmpty(mapVdisSrs)

    if (useStorageMotion) {
      await this._migrateVmWithStorageMotion(vm, hostXapi, host, {
        migrationNetwork: migrationNetworkId && hostXapi.getObject(migrationNetworkId),
        sr,
        mapVdisSrs,
        mapVifsNetworks,
        force,
        bypassAssert,
      })
    } else {
      try {
        await this.callAsync('VM.pool_migrate', vm.$ref, host.$ref, {
          force: force ? 'true' : 'false',
        })
      } catch (error) {
        if (error.code !== 'VM_REQUIRES_SR') {
          throw error
        }

        // Retry using motion storage.
        await this._migrateVmWithStorageMotion(vm, hostXapi, host, { force })
      }
    }
  }

  async _startVm(vm, { force = false, bypassMacAddressesCheck = force, hostId } = {}) {
    if (!bypassMacAddressesCheck) {
      const vmMacAddresses = vm.$VIFs.map(vif => vif.MAC)
      if (new Set(vmMacAddresses).size !== vmMacAddresses.length) {
        throw operationFailed({ objectId: vm.id, code: 'DUPLICATED_MAC_ADDRESS' })
      }

      const existingMacAddresses = new Set(
        filter(
          this.objects.all,
          obj => obj.id !== vm.id && obj.$type === 'VM' && obj.power_state === 'Running'
        ).flatMap(vm => vm.$VIFs.map(vif => vif.MAC))
      )
      if (vmMacAddresses.some(mac => existingMacAddresses.has(mac))) {
        throw operationFailed({ objectId: vm.id, code: 'DUPLICATED_MAC_ADDRESS' })
      }
    }

    log.debug(`Starting VM ${vm.name_label}`)

    if (force) {
      await vm.update_blocked_operations({ start: null, start_on: null })
    }

    const vmRef = vm.$ref
    if (hostId === undefined) {
      try {
        await this.call(
          'VM.start',
          vmRef,
          false, // Start paused?
          false // Skip pre-boot checks?
        )
      } catch (error) {
        if (error.code !== 'NO_HOSTS_AVAILABLE') {
          throw error
        }

        throw Object.assign(
          new AggregateError(
            await asyncMap(await this.call('host.get_all'), async hostRef => {
              const hostNameLabel = await this.call('host.get_name_label', hostRef)
              try {
                await this.call('VM.assert_can_boot_here', vmRef, hostRef)
                return `${hostNameLabel}: OK`
              } catch (error) {
                return `${hostNameLabel}: ${error.message}`
              }
            }),
            error.message
          ),
          { code: error.code, params: error.params }
        )
      }
    } else {
      const hostRef = this.getObject(hostId).$ref
      let retry
      do {
        retry = false

        try {
          await this.callAsync('VM.start_on', vmRef, hostRef, false, false)
        } catch (error) {
          if (error.code !== 'NO_HOSTS_AVAILABLE') {
            throw error
          }

          await this.call('VM.assert_can_boot_here', vmRef, hostRef)

          // Something has changed between the last two calls, starting the VM should be retried
          retry = true
        }
      } while (retry)
    }
  }

  async startVm(vmId, options) {
    try {
      await this._startVm(this.getObject(vmId), options)
    } catch (e) {
      if (e.code === 'OPERATION_BLOCKED') {
        throw forbiddenOperation('Start', e.params[1])
      }
      if (e.code === 'VM_BAD_POWER_STATE') {
        return e.params[2] === 'paused' ? this.unpauseVm(vmId) : this.resumeVm(vmId)
      }
      throw e
    }
  }

  async startVmOnCd(vmId) {
    const vm = this.getObject(vmId)

    if (isVmHvm(vm)) {
      const { order } = vm.HVM_boot_params

      await vm.update_HVM_boot_params('order', 'd')

      try {
        await this._startVm(vm)
      } finally {
        await vm.update_HVM_boot_params('order', order)
      }
    } else {
      // Find the original template by name (*sigh*).
      const templateNameLabel = vm.other_config.base_template_name
      const template =
        templateNameLabel &&
        find(this.objects.all, obj => obj.$type === 'VM' && obj.is_a_template && obj.name_label === templateNameLabel)

      const bootloader = vm.PV_bootloader
      const bootables = []
      try {
        const promises = []

        const cdDrive = this._getVmCdDrive(vm)
        forEach(vm.$VBDs, vbd => {
          promises.push(vbd.set_bootable(vbd === cdDrive))

          bootables.push([vbd, Boolean(vbd.bootable)])
        })

        promises.push(
          vm.set_PV_bootloader('eliloader'),
          vm.update_other_config({
            'install-distro': template && template.other_config['install-distro'],
            'install-repository': 'cdrom',
          })
        )

        await Promise.all(promises)

        await this._startVm(vm)
      } finally {
        vm.set_PV_bootloader(bootloader)::ignoreErrors()

        forEach(bootables, ([vbd, bootable]) => {
          vbd.set_bootable(bootable)::ignoreErrors()
        })
      }
    }
  }

  // =================================================================

  _cloneVdi(vdi) {
    log.debug(`Cloning VDI ${vdi.name_label}`)

    return this.callAsync('VDI.clone', vdi.$ref)
  }

  async moveVdi(vdiId, srId, { _failOnCbtError = false } = {}) {
    const vdi = this.getObject(vdiId)
    const sr = this.getObject(srId)

    if (vdi.SR === sr.$ref) {
      return vdi
    }

    log.debug(`Moving VDI ${vdi.name_label} from ${vdi.$SR.name_label} to ${sr.name_label}`)
    try {
      return this.barrier(
        await pRetry(() => this.callAsync('VDI.pool_migrate', vdi.$ref, sr.$ref, {}), {
          when: { code: 'TOO_MANY_STORAGE_MIGRATES' },
        })
      )
    } catch (error) {
      const { code } = error
      if (code === 'VDI_CBT_ENABLED' && !_failOnCbtError) {
        log.debug(`${vdi.name_label} has CBT enabled`)
        // disks attached to dom0 are a xapi internal
        // it can be, for example, during an export
        // we shouldn't consider these VBDs are relevant here
        const vbds = vdi.$VBDs.filter(({ $VM }) => $VM.is_control_domain === false)
        if (vbds.length === 0) {
          log.debug(`will disable CBT on ${vdi.name_label}  `)
          await this.call('VDI.disable_cbt', vdi.$ref)
        } else {
          if (vbds.length > 1) {
            // no implicit workaround if vdi is attached to multiple VMs
            throw error
          }
          // 20240629 we need to disable CBT on all disks of the VM since the xapi
          // checks all disk of a VM even to migrate only one disk
          const vbd = vbds[0]
          log.debug(`will disable CBT on the full VM ${vbd.$VM.name_label}, containing disk ${vdi.name_label}  `)
          await this.VM_disableChangedBlockTracking(vbd.VM)
        }

        // cbt will be re enabled when needed on next backup
        // after a migration the next delta backup is always a base copy
        // and this will only enabled cbt on needed disks

        // retry migrating disk
        return this.moveVdi(vdiId, srId, { _failOnCbtError: true })
      }
      if (code !== 'NO_HOSTS_AVAILABLE' && code !== 'LICENCE_RESTRICTION' && code !== 'VDI_NEEDS_VM_FOR_MIGRATE') {
        throw error
      }
      const newVdi = await this.barrier(await this.callAsync('VDI.copy', vdi.$ref, sr.$ref))
      await asyncMapSettled(vdi.$VBDs, async vbd => {
        await this.call('VBD.destroy', vbd.$ref)
        await this.VBD_create({
          ...vbd,
          VDI: newVdi.$ref,
        })
      })
      await vdi.$destroy()

      return newVdi
    }
  }

  _resizeVdi(vdi, size) {
    log.debug(`Resizing VDI ${vdi.name_label} from ${vdi.virtual_size} to ${size}`)

    return this.callAsync('VDI.resize', vdi.$ref, size)
  }

  _getVmCdDrive(vm) {
    for (const vbd of vm.$VBDs) {
      if (vbd.type === 'CD') {
        return vbd
      }
    }
  }

  async _ejectCdFromVm(vm) {
    const cdDrive = this._getVmCdDrive(vm)
    if (cdDrive) {
      await this.callAsync('VBD.eject', cdDrive.$ref)
    }
  }

  async _insertCdIntoVm(cd, vm, { bootable = false, force = false } = {}) {
    const cdDrive = await this._getVmCdDrive(vm)
    if (cdDrive) {
      try {
        await this.callAsync('VBD.insert', cdDrive.$ref, cd.$ref)
      } catch (error) {
        if (!force || error.code !== 'VBD_NOT_EMPTY') {
          throw error
        }

        await this.callAsync('VBD.eject', cdDrive.$ref)::ignoreErrors()

        // Retry.
        await this.callAsync('VBD.insert', cdDrive.$ref, cd.$ref)
      }

      if (bootable !== Boolean(cdDrive.bootable)) {
        await cdDrive.set_bootable(bootable)
      }
    } else {
      await this.VBD_create({
        bootable,
        type: 'CD',
        VDI: cd.$ref,
        VM: vm.$ref,
      })
    }
  }

  async connectVbd(vbdId) {
    await this.callAsync('VBD.plug', vbdId)
  }

  // TODO: remove when no longer used.
  async destroyVbdsFromVm(vmId) {
    await Promise.all(this.getObject(vmId).VBDs.map(async ref => this.VBD_destroy(ref)))
  }

  async resizeVdi(vdiId, size) {
    await this._resizeVdi(this.getObject(vdiId), size)
  }

  async ejectCdFromVm(vmId) {
    await this._ejectCdFromVm(this.getObject(vmId))
  }

  async insertCdIntoVm(cdId, vmId, opts = undefined) {
    await this._insertCdIntoVm(this.getObject(cdId), this.getObject(vmId), opts)
  }

  // -----------------------------------------------------------------

  async snapshotVdi(vdiId, nameLabel) {
    const vdi = this.getObject(vdiId)

    const snap = await this._getOrWaitObject(await this.callAsync('VDI.snapshot', vdi.$ref))

    if (nameLabel) {
      await snap.set_name_label(nameLabel)
    }

    return snap
  }

  async exportVdiAsVmdk(vdi, filename, { cancelToken = CancelToken.none, base, nbdConcurrency, preferNbd } = {}) {
    vdi = this.getObject(vdi)
    const params = { cancelToken, format: VDI_FORMAT_VHD, nbdConcurrency, preferNbd }
    if (base !== undefined) {
      params.base = base
    }
    let vhdResult
    const vmdkStream = await vhdToVMDK(`${vdi.name_label}.vmdk`, async () => {
      vhdResult = await this.VDI_exportContent(vdi.$ref, params)
      return vhdResult
    })
    return vmdkStream
  }

  // =================================================================

  @decorateWith(deferrable)
  async createNetwork($defer, { name, description = 'Created with Xen Orchestra', pifId, mtu, vlan }) {
    const networkRef = await this.call('network.create', {
      name_label: name,
      name_description: description,
      MTU: mtu,
      // Set automatic to false so XenCenter does not get confused
      // https://citrix.github.io/xenserver-sdk/#network
      other_config: { automatic: 'false' },
    })
    $defer.onFailure(() => this.callAsync('network.destroy', networkRef))
    if (pifId) {
      await this.call('pool.create_VLAN_from_PIF', this.getObject(pifId).$ref, networkRef, asInteger(vlan))
    }

    return this._getOrWaitObject(networkRef)
  }

  async editPif(pifId, { vlan }) {
    const pif = this.getObject(pifId)
    const physPif = find(
      this.objects.all,
      obj =>
        obj.$type === 'PIF' &&
        (obj.physical || !isEmpty(obj.bond_master_of)) &&
        obj.$pool === pif.$pool &&
        obj.device === pif.device
    )

    if (!physPif) {
      throw new Error('PIF not found')
    }

    const pifs = this.getObject(pif.network).$PIFs

    const wasAttached = {}
    forEach(pifs, pif => {
      wasAttached[pif.host] = pif.currently_attached
    })

    const vlans = uniq(pifs.map(pif => pif.VLAN_master_of))
    await Promise.all(vlans.map(vlan => Ref.isNotEmpty(vlan) && this.callAsync('VLAN.destroy', vlan)))

    const newPifs = await this.call('pool.create_VLAN_from_PIF', physPif.$ref, pif.network, asInteger(vlan))
    await Promise.all(
      newPifs.map(
        pifRef => !wasAttached[this.getObject(pifRef).host] && this.callAsync('PIF.unplug', pifRef)::ignoreErrors()
      )
    )
  }

  @decorateWith(deferrable)
  async createBondedNetwork($defer, { bondMode, pifIds: masterPifIds, ...params }) {
    const network = await this.createNetwork(params)
    $defer.onFailure(() => this.deleteNetwork(network))

    const pifsByHost = {}
    masterPifIds.forEach(pifId => {
      this.getObject(pifId).$network.$PIFs.forEach(pif => {
        if (pifsByHost[pif.host] === undefined) {
          pifsByHost[pif.host] = []
        }
        pifsByHost[pif.host].push(pif.$ref)
      })
    })

    await asyncMapSettled(pifsByHost, pifs => this.call('Bond.create', network.$ref, pifs, '', bondMode))

    return network
  }

  async deleteNetwork(networkId) {
    const network = this.getObject(networkId)
    const pifs = network.$PIFs

    const vlans = uniq(pifs.map(pif => pif.VLAN_master_of))
    await Promise.all(vlans.map(vlan => Ref.isNotEmpty(vlan) && this.callAsync('VLAN.destroy', vlan)))

    const bonds = uniq(flatten(pifs.map(pif => pif.bond_master_of)))
    await Promise.all(bonds.map(bond => this.call('Bond.destroy', bond)))

    const tunnels = filter(this.objects.all, { $type: 'tunnel' })
    await Promise.all(
      pifs.map(async pif => {
        const tunnel = find(tunnels, { access_PIF: pif.$ref })
        if (tunnel != null) {
          await this.callAsync('tunnel.destroy', tunnel.$ref)
        }
      })
    )

    await this.callAsync('network.destroy', network.$ref)
  }

  // =================================================================

  async _doDockerAction(vmId, action, containerId) {
    const vm = this.getObject(vmId)
    const host = vm.$resident_on || this.pool.$master

    return /* await */ this.call('host.call_plugin', host.$ref, 'xscontainer', action, {
      vmuuid: vm.uuid,
      container: containerId,
    })
  }

  async registerDockerContainer(vmId) {
    await this._doDockerAction(vmId, 'register')
  }

  async deregisterDockerContainer(vmId) {
    await this._doDockerAction(vmId, 'deregister')
  }

  async startDockerContainer(vmId, containerId) {
    await this._doDockerAction(vmId, 'start', containerId)
  }

  async stopDockerContainer(vmId, containerId) {
    await this._doDockerAction(vmId, 'stop', containerId)
  }

  async restartDockerContainer(vmId, containerId) {
    await this._doDockerAction(vmId, 'restart', containerId)
  }

  async pauseDockerContainer(vmId, containerId) {
    await this._doDockerAction(vmId, 'pause', containerId)
  }

  async unpauseDockerContainer(vmId, containerId) {
    await this._doDockerAction(vmId, 'unpause', containerId)
  }

  async getCloudInitConfig(templateId) {
    const template = this.getObject(templateId)
    const host = this.pool.$master

    const config = await this.call('host.call_plugin', host.$ref, 'xscontainer', 'get_config_drive_default', {
      templateuuid: template.uuid,
    })
    return config.slice(4) // FIXME remove the "True" string on the begining
  }

  // Specific CoreOS Config Drive
  async createCoreOsCloudInitConfigDrive(vmId, srId, config) {
    const vm = this.getObject(vmId)
    const host = this.pool.$master
    const sr = this.getObject(srId)

    // See https://github.com/xenserver/xscontainer/blob/master/src/scripts/xscontainer-pluginexample
    const vdiUuid = (
      await this.call('host.call_plugin', host.$ref, 'xscontainer', 'create_config_drive', {
        vmuuid: vm.uuid,
        sruuid: sr.uuid,
        configuration: config,
      })
    ).replace(/^True/, '')
    await this.registerDockerContainer(vmId)

    return vdiUuid
  }

  // Generic Config Drive
  @decorateWith(deferrable)
  async createCloudInitConfigDrive($defer, vmId, srId, userConfig, networkConfig) {
    const vm = this.getObject(vmId)
    const sr = this.getObject(srId)

    // First, create a small VDI (10MB) which will become the ConfigDrive
    let buffer = fatfsBufferInit({ label: 'cidata     ' })

    // Then, generate a FAT fs
    const { mkdir, writeFile } = promisifyAll(fatfs.createFileSystem(fatfsBuffer(buffer)))

    await Promise.all([
      // preferred datasource: NoCloud
      //
      // https://cloudinit.readthedocs.io/en/latest/topics/datasources/nocloud.html
      writeFile('meta-data', 'instance-id: ' + vm.uuid + '\n'),
      writeFile('user-data', userConfig),
      networkConfig !== undefined && writeFile('network-config', networkConfig),

      // fallback datasource: Config Drive 2
      //
      // https://cloudinit.readthedocs.io/en/latest/topics/datasources/configdrive.html#version-2
      mkdir('openstack').then(() =>
        mkdir('openstack/latest').then(() =>
          Promise.all([
            writeFile('openstack/latest/meta_data.json', JSON.stringify({ uuid: vm.uuid })),
            writeFile('openstack/latest/user_data', userConfig),
          ])
        )
      ),
    ])
    // only add the MBR for windows VM
    if (vm.platform.viridian === 'true') {
      buffer = addMbr(buffer)
    }
    const vdi = await this._getOrWaitObject(
      await this.VDI_create({
        name_label: 'XO CloudConfigDrive',
        SR: sr.$ref,
        virtual_size: buffer.length,
      })
    )
    $defer.onFailure(() => vdi.$destroy())

    // ignore errors, I (JFT) don't understand why they are emitted
    // because it works
    await vdi.$importContent(buffer, { format: VDI_FORMAT_RAW }).catch(error => {
      log.warn('importVdiContent: ', { error })
    })

    await this.VBD_create({ VDI: vdi.$ref, VM: vm.$ref })

    return vdi.uuid
  }

  @decorateWith(deferrable)
  async createTemporaryVdiOnSr($defer, stream, sr, name_label, name_description) {
    const vdi = await this._getOrWaitObject(
      await this.VDI_create({
        name_description,
        name_label,
        SR: sr.$ref,
        virtual_size: stream.length,
      })
    )
    $defer.onFailure(() => vdi.$destroy())

    await vdi.$importContent(stream, { format: VDI_FORMAT_RAW })

    return vdi
  }

  // Create VDI on an adequate local SR
  async createTemporaryVdiOnHost(stream, hostId, name_label, name_description) {
    const pbd = find(this.getObject(hostId).$PBDs, pbd => canSrHaveNewVdiOfSize(pbd.$SR, stream.length))

    if (pbd == null) {
      throw new Error('no SR available')
    }

    return this.createTemporaryVdiOnSr(stream, pbd.$SR, name_label, name_description)
  }

  findAvailableSharedSr(minSize) {
    return find(this.objects.all, obj => obj.$type === 'SR' && obj.shared && canSrHaveNewVdiOfSize(obj, minSize))
  }

  // Main purpose: upload update on VDI
  // Is a local SR on a non master host OK?
  findAvailableSr(minSize) {
    return find(this.objects.all, obj => obj.$type === 'SR' && canSrHaveNewVdiOfSize(obj, minSize))
  }

  @decorateWith(debounceWithKey, 60e3, hostRef => hostRef)
  async _getHostServerTimeShift(hostRef) {
    return Math.abs(parseDateTime(await this.call('host.get_servertime', hostRef)) * 1e3 - Date.now())
  }

  async isHostServerTimeConsistent(hostRef) {
    return (await this._getHostServerTimeShift(hostRef)) < 30e3
  }

  async assertConsistentHostServerTime(hostRef) {
    if (!(await this.isHostServerTimeConsistent(hostRef))) {
      throw new Error(
        `host server time and XOA date are not consistent with each other (${ms(
          await this._getHostServerTimeShift(hostRef)
        )})`
      )
    }
  }

  async isHyperThreadingEnabled(hostId) {
    const host = this.getObject(hostId)

    // For XCP-ng >=8.3, data is already available in XAPI
    const { threads_per_core } = host.cpu_info
    if (threads_per_core !== undefined) {
      return threads_per_core > 1
    }

    try {
      return (await this.call('host.call_plugin', host.$ref, 'hyperthreading.py', 'get_hyperthreading', {})) !== 'false'
    } catch (error) {
      if (error.code === 'XENAPI_MISSING_PLUGIN' || error.code === 'UNKNOWN_XENAPI_PLUGIN_FUNCTION') {
        return null
      } else {
        throw error
      }
    }
  }

  async getSmartctlHealth(hostId) {
    try {
      return JSON.parse(await this.call('host.call_plugin', this.getObject(hostId).$ref, 'smartctl.py', 'health', {}))
    } catch (error) {
      if (error.code === 'XENAPI_MISSING_PLUGIN' || error.code === 'UNKNOWN_XENAPI_PLUGIN_FUNCTION') {
        return null
      } else {
        throw error
      }
    }
  }

  async getSmartctlInformation(hostId, deviceNames) {
    try {
      const informations = JSON.parse(
        await this.call('host.call_plugin', this.getObject(hostId).$ref, 'smartctl.py', 'information', {})
      )
      if (deviceNames === undefined) {
        return informations
      }
      return pick(informations, deviceNames)
    } catch (error) {
      if (error.code === 'XENAPI_MISSING_PLUGIN' || error.code === 'UNKNOWN_XENAPI_PLUGIN_FUNCTION') {
        return null
      } else {
        throw error
      }
    }
  }

  async getBiosInfo(ref, { cache } = {}) {
    const biosData = await this.call('host.get_bios_strings', ref)

    const { 'bios-version': currentBiosVersion, 'system-product-name': hostServerName } = biosData

    if (biosData['system-manufacturer']?.toLowerCase() !== '2crsi') {
      return
    }

    // this code has race conditions which might lead to multiple fetches in parallel
    // but it's no big deal
    if (!cache?.has('servers')) {
      const response = await fetch(
        'https://pictures.2cr.si/Images_site_web_Odoo/Pages_produit/VATES-BIOS_BMC_last-version.json'
      )
      const json = await response.json()
      const servers = keyBy(json[0]['2CRSi_Servers'], 'Server_Name')

      cache?.set('servers', servers)
    }

    const parsedData = cache?.get('servers')

    const serverData = parsedData?.[hostServerName]

    if (serverData === undefined) {
      return
    }

    const { 'BIOS-Version': latestBiosVersion, 'BIOS-link': biosLink } = serverData
    const isUpToDate = currentBiosVersion === latestBiosVersion

    return { currentBiosVersion, latestBiosVersion, biosLink, isUpToDate }
  }
}
