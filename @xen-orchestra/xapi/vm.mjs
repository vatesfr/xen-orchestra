import CancelToken from 'promise-toolbox/CancelToken'
import groupBy from 'lodash/groupBy.js'
import hrp from 'http-request-plus'
import ignoreErrors from 'promise-toolbox/ignoreErrors'
import pickBy from 'lodash/pickBy.js'
import omit from 'lodash/omit.js'
import pCatch from 'promise-toolbox/catch'
import { asyncMap } from '@xen-orchestra/async-map'
import { createLogger } from '@xen-orchestra/log'
import { decorateClass } from '@vates/decorate-with'
import { defer } from 'golike-defer'
import { extract } from '@xen-orchestra/xapi/xoData.mjs'
import { finished } from 'node:stream'
import { incorrectState, forbiddenOperation } from 'xo-common/api-errors.js'
import { JsonRpcError } from 'json-rpc-protocol'
import { Ref } from 'xen-api'

import isDefaultTemplate from './isDefaultTemplate.mjs'
import isVmRunning from './_isVmRunning.mjs'

const { warn } = createLogger('xo:xapi:vm')

const BIOS_STRINGS_KEYS = new Set([
  'baseboard-asset-tag',
  'baseboard-location-in-chassis',
  'baseboard-manufacturer',
  'baseboard-product-name',
  'baseboard-serial-number',
  'baseboard-version',
  'bios-vendor',
  'bios-version',
  'enclosure-asset-tag',
  'system-manufacturer',
  'system-product-name',
  'system-serial-number',
  'system-version',
])
const cleanBiosStrings = biosStrings => {
  if (biosStrings !== undefined) {
    biosStrings = pickBy(biosStrings, (value, key) => value !== '' && BIOS_STRINGS_KEYS.has(key))

    if (Object.keys(biosStrings).length !== 0) {
      return biosStrings
    }
  }
}

// See: https://github.com/xapi-project/xen-api/blob/324bc6ee6664dd915c0bbe57185f1d6243d9ed7e/ocaml/xapi/xapi_guest_agent.ml#L59-L81
//
// Returns <min(n)>/ip || <min(n)>/ipv4/<min(m)> || <min(n)>/ipv6/<min(m)> || undefined
// where n corresponds to the network interface and m to its IP
const IPV4_KEY_RE = /^\d+\/ip(?:v4\/\d+)?$/
const IPV6_KEY_RE = /^\d+\/ipv6\/\d+$/
function getVmAddress(networks) {
  if (networks !== undefined) {
    let ipv6
    for (const key of Object.keys(networks).sort()) {
      if (IPV4_KEY_RE.test(key)) {
        return networks[key]
      }

      if (ipv6 === undefined && IPV6_KEY_RE.test(key)) {
        ipv6 = networks[key]
      }
    }
    if (ipv6 !== undefined) {
      return ipv6
    }
  }
  throw new Error('no VM address found')
}

async function listTaggedVdiVbds(xapi, vbdRefs, tag) {
  const vbds = []
  await asyncMap(vbdRefs, async vbdRef => {
    const vbd = await xapi.getRecord('VBD', vbdRef)
    if (
      vbd.type === 'Disk' &&
      Ref.isNotEmpty(vbd.VDI) &&
      (await xapi.getField('VDI', vbd.VDI, 'name_label')).includes(tag)
    ) {
      vbds.push(vbd)
    }
  })
  return vbds
}

async function safeGetRecord(xapi, type, ref) {
  try {
    return await xapi.getRecord(type, ref)
  } catch (_) {
    return ref
  }
}

const noop = Function.prototype

class Vm {
  async _assertHealthyVdiChain(vdiRefOrUuid, cache, tolerance) {
    let vdi = cache[vdiRefOrUuid]
    if (vdi === undefined) {
      try {
        vdi = await this[vdiRefOrUuid.startsWith('OpaqueRef:') ? 'getRecord' : 'getRecordByUuid']('VDI', vdiRefOrUuid)
      } catch (error) {
        warn('_assertHealthyVdiChain, could not fetch VDI', { error })
        return
      }
      cache[vdi.$ref] = vdi
      cache[vdi.uuid] = vdi
    }

    if (!vdi.managed) {
      const srRef = vdi.SR
      let childrenMap = cache[srRef]
      if (childrenMap === undefined) {
        const vdiRefs = await this.getField('SR', srRef, 'VDIs')
        childrenMap = groupBy(
          (
            await Promise.all(
              vdiRefs.map(async vdiRef => {
                let vdi = cache[vdiRef]
                if (vdi === undefined) {
                  try {
                    vdi = await this.getRecord('VDI', vdiRef)
                  } catch (error) {
                    warn('_assertHealthyVdiChain, could not fetch VDI', { error })
                    return
                  }
                  cache[vdiRef] = vdi
                  cache[vdi.uuid] = vdi
                }
                return vdi
              })
            )
          ).filter(_ => _ !== undefined),
          vdi => vdi.sm_config['vhd-parent']
        )
      }

      // an unmanaged VDI should not have exactly one child: they
      // should coalesce
      const children = childrenMap[vdi.uuid]
      if (
        children !== undefined && // unused unmanaged VDI, will be GC-ed
        children.length === 1 &&
        !children[0].managed && // some SRs do not coalesce the leaf
        tolerance-- <= 0
      ) {
        throw new Error('unhealthy VDI chain')
      }
    }

    const parentUuid = vdi.sm_config['vhd-parent']
    if (parentUuid !== undefined) {
      return this._assertHealthyVdiChain(parentUuid, cache, tolerance)
    }
  }

  async _httpHook({ guest_metrics, power_state, tags, uuid }, pathname) {
    if (power_state !== 'Running') {
      return
    }

    let url
    let i = tags.length
    do {
      if (i === 0) {
        return
      }
      const tag = tags[--i]
      if (tag === 'xo:notify-on-snapshot') {
        const { networks } = await this.getRecord('VM_guest_metrics', guest_metrics)
        url = Object.assign(new URL('https://locahost'), {
          hostname: getVmAddress(networks),
          port: 1727,
        })
      } else {
        const prefix = 'xo:notify-on-snapshot='
        if (tag.startsWith(prefix)) {
          url = new URL(tag.slice(prefix.length))
        }
      }
    } while (url === undefined)

    url.pathname = pathname

    const headers = {}
    const secret = this._asyncHookSecret
    if (secret !== undefined) {
      headers.authorization = 'Bearer ' + Buffer.from(secret).toString('base64')
    }

    try {
      await hrp(url, {
        headers,
        rejectUnauthorized: false,
        timeout: this._syncHookTimeout ?? 60e3,
      })
    } catch (error) {
      warn('HTTP hook failed', { error, url, vm: uuid })
    }
  }

  async assertHealthyVdiChains(vmRef, tolerance = this._maxUncoalescedVdis) {
    const vdiRefs = {}
    ;(await this.getRecords('VBD', await this.getField('VM', vmRef, 'VBDs'))).forEach(({ VDI: ref }) => {
      if (Ref.isNotEmpty(ref)) {
        vdiRefs[ref] = true
      }
    })
    const cache = { __proto__: null }
    for (const vdiRef of Object.keys(vdiRefs)) {
      await this._assertHealthyVdiChain(vdiRef, cache, tolerance)
    }
  }

  // does not support NOBAK VDIs because unplugging or destroying VBDs/VDIs on
  // a suspended VM is not supported
  async checkpoint($defer, vmRef, { cancelToken = CancelToken.none, name_label } = {}) {
    const vm = await this.getRecord('VM', vmRef)

    await this._httpHook(vm, '/sync')

    if (name_label === undefined) {
      name_label = vm.name_label
    }
    try {
      const ref = await this.callAsync(cancelToken, 'VM.checkpoint', vmRef, name_label)

      // detached async
      this._httpHook(vm, '/post-sync').catch(noop)

      // VM checkpoints are marked as templates, unfortunately it does not play well with XVA export/import
      // which will import them as templates and not VM checkpoints or plain VMs
      await pCatch.call(
        this.setField('VM', ref, 'is_a_template', false),

        // Ignore if this fails due to license restriction
        //
        // see https://bugs.xenserver.org/browse/XSO-766
        { code: 'LICENSE_RESTRICTION' },
        noop
      )

      return ref
    } catch (error) {
      if (error.code === 'VM_BAD_POWER_STATE') {
        return this.VM_snapshot(vmRef, { cancelToken, name_label })
      }
      throw error
    }
  }

  async create(
    $defer,
    {
      actions_after_crash = 'restart',
      actions_after_reboot = 'restart',
      actions_after_shutdown = 'destroy',
      affinity = Ref.EMPTY,
      appliance,
      blocked_operations,
      domain_type,
      generation_id,
      ha_restart_priority,
      hardware_platform_version,
      has_vendor_device = false, // Avoid issue with some Dundee builds.
      HVM_boot_params,
      HVM_boot_policy,
      HVM_shadow_multiplier,
      is_a_template = false,
      is_vmss_snapshot,
      last_boot_CPU_flags, // Used when the VM is created Suspended
      last_booted_record, // Used when the VM is created Suspended
      memory_static_max,
      memory_static_min,
      name_description,
      name_label,
      NVRAM,
      order,
      other_config = {},
      PCI_bus = '',
      platform,
      PV_args,
      PV_bootloader_args,
      PV_bootloader,
      PV_kernel,
      PV_legacy_args,
      PV_ramdisk,
      recommendations,
      reference_label,
      shutdown_delay,
      snapshot_schedule,
      start_delay,
      suspend_SR,
      tags,
      user_version,
      VCPUs_at_startup,
      VCPUs_max,
      VCPUs_params,
      version,
      xenstore_data,

      memory_dynamic_max = memory_static_max,
      memory_dynamic_min = memory_static_min,
    },
    {
      // not supported by `VM.create`, therefore it should be passed explicitly
      bios_strings,

      // The field `other_config.mac_seed` is used (in conjunction with VIFs'
      // devices) to generate MAC addresses of VIFs for this VM.
      //
      // It's automatically generated by VM.create if missing.
      //
      // If this is true, it will be filtered out by this method to ensure a
      // new one is generated.
      //
      // See https://github.com/xapi-project/xen-api/blob/0a6d6de0704ca2cc439326c35af7cf45128a17d5/ocaml/xapi/xapi_vm.ml#L628
      generateMacSeed = true,

      // if set, will create the VM in Suspended power_state with this VDI
      //
      // it's a separate param because it's not supported for all versions of
      // XCP-ng/XenServer and should be passed explicitly
      suspend_VDI,
    } = {}
  ) {
    const ref = await this.call('VM.create', {
      actions_after_crash,
      actions_after_reboot,
      actions_after_shutdown,
      affinity,
      HVM_boot_params,
      HVM_boot_policy,
      is_a_template,
      memory_dynamic_max,
      memory_dynamic_min,
      memory_static_max,
      memory_static_min,
      other_config: generateMacSeed ? omit(other_config, 'mac_seed') : other_config,
      PCI_bus,
      platform,
      PV_args,
      PV_bootloader_args,
      PV_bootloader,
      PV_kernel,
      PV_legacy_args,
      PV_ramdisk,
      recommendations,
      user_version,
      VCPUs_at_startup,
      VCPUs_max,
      VCPUs_params,

      // Optional fields.
      appliance,
      blocked_operations,
      domain_type,
      generation_id,
      ha_restart_priority,
      hardware_platform_version,
      has_vendor_device,
      is_vmss_snapshot,
      name_description,
      name_label,
      NVRAM,
      order,
      reference_label,
      shutdown_delay,
      snapshot_schedule,
      start_delay,
      suspend_SR,
      tags,
      version,
      xenstore_data,

      // this field is a float, and float values without a decimal parts are incorrectly handled in some cases:
      // - the JSON-RPC implementation of XenServer 7.2
      // - the XML-RPC implementation used by the `xen-api` library
      //
      // because this field is optional, it can simply not be passed when equal to its default value of `1` which is
      // almost always the case.
      HVM_shadow_multiplier: HVM_shadow_multiplier === 1 ? undefined : HVM_shadow_multiplier,

      // VM created Suspended
      last_boot_CPU_flags,
      last_booted_record,
      power_state: suspend_VDI !== undefined ? 'Suspended' : undefined,
      suspend_VDI,
    })
    $defer.onFailure.call(this, 'call', 'VM.destroy', ref)

    bios_strings = cleanBiosStrings(bios_strings)
    if (bios_strings !== undefined) {
      // Only available on XS >= 7.3
      await pCatch.call(this.call('VM.set_bios_strings', ref, bios_strings), { code: 'MESSAGE_METHOD_UNKNOWN' }, noop)
    }

    return ref
  }

  async createCloudInitConfig(vmRef, cloudConfig, { networkConfig } = {}) {
    const vm = await this.getRecord('VM', vmRef)

    // Find the SR of the first VDI.
    let sr
    for (const vbdRef of vm.VBDs) {
      const vbd = await this.getRecord('VBD', vbdRef)

      if (vbd.type !== 'CD' && vbd.VDI !== undefined && Ref.isNotEmpty(vbd.VDI)) {
        sr = await this.getRecord('SR', await this.getField('VDI', vbd.VDI, 'SR'))
        break
      }
    }

    if (sr === undefined) {
      throw new Error("Can't create cloud init config drive for VM without disks")
    }

    const {
      creation: { template: templateUuid },
    } = extract(vm)
    const isCoreOsTemplate = (await this.getFieldByUuid('VM', templateUuid, 'name_label')) === 'CoreOS'

    const vmId = vm.uuid
    const srId = sr.uuid
    try {
      return await (isCoreOsTemplate
        ? this.createCoreOsCloudInitConfigDrive(vmId, srId, cloudConfig)
        : this.createCloudInitConfigDrive(vmId, srId, cloudConfig, networkConfig))
    } catch (error) {
      warn('createCloudInitConfig failed', { vmId, srId })
      throw error
    }
  }

  async destroy(
    vmRef,
    { deleteDisks = true, force = false, bypassBlockedOperation = force, forceDeleteDefaultTemplate = force } = {}
  ) {
    const vm = await this.getRecord('VM', vmRef)

    if (!bypassBlockedOperation && 'destroy' in vm.blocked_operations) {
      throw forbiddenOperation(
        `destroy is blocked: ${
          vm.blocked_operations.destroy === 'true'
            ? 'protected from accidental deletion'
            : vm.blocked_operations.destroy
        }`
      )
    }

    if (!forceDeleteDefaultTemplate && isDefaultTemplate(vm)) {
      throw incorrectState({
        actual: true,
        expected: false,
        object: vm.$id,
        property: 'isDefaultTemplate',
      })
    }

    // It is necessary for suspended VMs to be shut down
    // to be able to delete their VDIs.
    if (vm.power_state !== 'Halted') {
      await this.call('VM.hard_shutdown', vmRef)
    }

    await Promise.all([
      forceDeleteDefaultTemplate &&
        // Only available on XS >= 7.2
        pCatch.call(vm.set_is_default_template(false), { code: 'MESSAGE_METHOD_UNKNOWN' }, noop),
      forceDeleteDefaultTemplate && vm.update_other_config('default_template', null),
      vm.set_is_a_template(false),
      bypassBlockedOperation && vm.update_blocked_operations('destroy', null),
    ])

    // must be done before destroying the VM
    const disks = await this.VM_getDisks(vmRef, vm.VBDs)

    // this cannot be done in parallel, otherwise disks and snapshots will be
    // destroyed even if this fails
    await this.call('VM.destroy', vmRef)

    await Promise.all([
      asyncMap(vm.snapshots, snapshotRef =>
        this.VM_destroy(snapshotRef).catch(error => {
          warn('VM_destroy: failed to destroy snapshot', {
            error,
            snapshotRef,
            vmRef,
          })
        })
      ),
      deleteDisks &&
        asyncMap(disks, async vdiRef => {
          try {
            // Dont destroy if attached to other (non control domain) VMs
            for (const vbdRef of await this.getField('VDI', vdiRef, 'VBDs')) {
              const vmRef2 = await this.getField('VBD', vbdRef, 'VM')
              if (vmRef2 !== vmRef && !(await this.getField('VM', vmRef2, 'is_control_domain'))) {
                return
              }
            }

            await this.VDI_destroy(vdiRef)
          } catch (error) {
            warn('VM_destroy: failed to destroy VDI', {
              error,
              vdiRef,
              vmRef,
            })
          }
        }),
    ])
  }

  async export($defer, vmRef, { cancelToken = CancelToken.none, compress = false, useSnapshot } = {}) {
    const vm = await this.getRecord('VM', vmRef)
    const taskRef = await this.task_create('VM export', vm.name_label)
    $defer.onFailure.call(this, 'task_destroy', taskRef)
    if (useSnapshot === undefined) {
      useSnapshot = isVmRunning(vm)
    }
    let exportedVmRef, destroySnapshot
    if (useSnapshot) {
      exportedVmRef = await this.VM_snapshot(vmRef, { cancelToken, name_label: `[XO Export] ${vm.name_label}` })
      destroySnapshot = () =>
        this.VM_destroy(exportedVmRef).catch(error => {
          warn('VM_export: failed to destroy snapshot', {
            error,
            snapshotRef: exportedVmRef,
            vmRef,
          })
        })
      $defer.onFailure(destroySnapshot)
    } else {
      exportedVmRef = vmRef
    }
    try {
      const response = await this.getResource(cancelToken, '/export/', {
        query: {
          ref: exportedVmRef,
          use_compression: compress === 'zstd' ? 'zstd' : compress === true || compress === 'gzip' ? 'true' : 'false',
        },
        task: taskRef,
      })

      if (useSnapshot) {
        finished(response.body, destroySnapshot)
      }

      return response
    } catch (error) {
      // augment the error with as much relevant info as possible
      const [poolMaster, exportedVm] = await Promise.all([
        safeGetRecord(this, 'host', this.pool.master),
        useSnapshot ? safeGetRecord(this, 'VM', exportedVmRef) : vmRef,
      ])
      error.pool_master = poolMaster
      error.VM = exportedVm
      throw error
    }
  }

  async getDisks(vmRef, vbdRefs) {
    if (vbdRefs === undefined) {
      vbdRefs = await this.getField('VM', vmRef, 'VBDs')
    }

    const disks = { __proto__: null }
    ;(await this.getRecords('VBD', vbdRefs)).forEach(vbd => {
      if (vbd.type === 'Disk' && Ref.isNotEmpty(vbd.VDI)) {
        disks[vbd.VDI] = true
      }
    })
    return Object.keys(disks)
  }

  async import(stream, srRef, onVmCreation = undefined) {
    const taskRef = await this.task_create('VM import')
    const query = {}
    if (srRef !== undefined) {
      query.sr_id = srRef
    }
    if (onVmCreation != null) {
      const original = onVmCreation
      onVmCreation = vm => {
        if (onVmCreation !== undefined) {
          onVmCreation = undefined
          stopWatch()
          return original(vm)
        }
      }

      const stopWatch = this.waitObject(
        obj => obj != null && obj.current_operations != null && taskRef in obj.current_operations,
        onVmCreation
      )
    }
    try {
      const [ref] = await this.putResource(stream, '/import/', {
        query,
        task: taskRef,
      })
      if (onVmCreation != null) {
        ignoreErrors.call(this.getRecord('VM', ref).then(onVmCreation))
      }
      return ref
    } catch (error) {
      if (
        // xxhash is the new form consistency hashing in CH 8.1 which uses a faster,
        // more efficient hashing algorithm to generate the consistency checks
        // in order to support larger files without the consistency checking process taking an incredibly long time
        error.code === 'IMPORT_ERROR' &&
        error.params?.some(
          param =>
            param.includes('INTERNAL_ERROR') &&
            param.includes('Expected to find an inline checksum') &&
            param.includes('.xxhash')
        )
      ) {
        warn('import', { error })
        throw new JsonRpcError('Importing this VM requires XCP-ng or Citrix Hypervisor >=8.1')
      }

      // augment the error with as much relevant info as possible
      const [poolMaster, sr] = await Promise.all([
        safeGetRecord(this, 'host', this.pool.master),
        safeGetRecord(this, 'SR', srRef),
      ])
      error.pool_master = poolMaster
      error.SR = sr
      throw error
    }
  }

  async coalesceLeaf($defer, vmRef) {
    try {
      await this.callAsync('VM.suspend', vmRef)
      $defer(() => this.callAsync('VM.resume', vmRef, false, true))
    } catch (error) {
      if (error.code !== 'VM_BAD_POWER_STATE') {
        throw error
      }

      const powerState = error.params[2].toLowerCase()
      if (powerState !== 'halted' && powerState !== 'suspended') {
        throw error
      }
    }

    // plugin doc: https://docs.xenserver.com/en-us/xenserver/8/storage/manage.html#reclaim-space-by-using-the-offline-coalesce-tool
    // result can be: `Success` or `VM has no leaf-coalesceable VDIs`
    // https://github.com/xapi-project/sm/blob/eb292457c5fd5f00f6fc82454a915068ab15aa6f/drivers/coalesce-leaf#L48
    const result = await this.callAsync('host.call_plugin', this.pool.master, 'coalesce-leaf', 'leaf-coalesce', {
      vm_uuid: await this.getField('VM', vmRef, 'uuid'),
    })

    if (result.toLowerCase() !== 'success') {
      throw new Error(result)
    }
  }

  async snapshot(
    $defer,
    vmRef,
    { cancelToken = CancelToken.none, ignoredVdisTag, name_label, unplugVusbs = false } = {}
  ) {
    const vm = await this.getRecord('VM', vmRef)

    await this._httpHook(vm, '/sync')

    const isHalted = vm.power_state === 'Halted'

    // requires the VM to be halted because it's not possible to re-plug VUSB on a live VM
    if (unplugVusbs && isHalted) {
      // vm.VUSBs can be undefined (e.g. on XS 7.0.0)
      const vusbs = vm.VUSBs
      if (vusbs !== undefined) {
        await asyncMap(vusbs, async ref => {
          const vusb = await this.getRecord('VUSB', ref)
          await vusb.$call('destroy')
          $defer.call(this, 'call', 'VUSB.create', vusb.VM, vusb.USB_group, vusb.other_config)
        })
      }
    }

    let ignoredVbds
    if (ignoredVdisTag !== undefined) {
      ignoredVbds = await listTaggedVdiVbds(this, vm.VBDs, ignoredVdisTag)
      if (ignoredVbds.length === 0) {
        ignoredVbds = undefined
      }
    }

    const params = [cancelToken, 'VM.snapshot', vmRef, name_label ?? vm.name_label]
    if (ignoredVbds !== undefined) {
      params.push(ignoredVbds.map(_ => _.VDI))
    }

    let destroyNobakVdis = false
    let ref
    try {
      ref = await this.callAsync(...params)
    } catch (error) {
      if (error.code !== 'MESSAGE_PARAMETER_COUNT_MISMATCH') {
        throw error
      }

      if (ignoredVbds !== undefined) {
        if (isHalted) {
          await asyncMap(ignoredVbds, async vbd => {
            await this.VBD_destroy(vbd.$ref)
            $defer.call(this, 'VBD_create', vbd)
          })
        } else {
          // cannot unplug VBDs on Running, Paused and Suspended VMs
          destroyNobakVdis = true
        }
      }

      params.pop()

      ref = await this.callAsync(...params)
    }

    // detached async
    this._httpHook(vm, '/post-sync').catch(noop)

    // VM snapshots are marked as templates, unfortunately it does not play well with XVA export/import
    // which will import them as templates and not VM snapshots or plain VMs
    await pCatch.call(
      this.setField('VM', ref, 'is_a_template', false),

      // Ignore if this fails due to license restriction
      //
      // see https://bugs.xenserver.org/browse/XSO-766
      { code: 'LICENSE_RESTRICTION' },
      noop
    )

    if (destroyNobakVdis) {
      // destroy the ignored VBDs on the VM snapshot
      const ignoredSnapshotVbds = await listTaggedVdiVbds(this, await this.getField('VM', ref, 'VBDs'), ignoredVdisTag)
      await asyncMap(ignoredSnapshotVbds, async vbd => {
        try {
          await this.VDI_destroy(vbd.VDI)
        } catch (error) {
          warn('VM_snapshot, failed to destroy ignored snapshot VDI', {
            error,
            vdiRef: vbd.VDI,
            vmRef,
            vmSnapshotRef: ref,
          })
        }
      })
    }

    return ref
  }

  async disableChangedBlockTracking(vmRef) {
    const vdiRefs = await this.VM_getDisks(vmRef)
    await Promise.all(vdiRefs.map(vdiRef => this.call('VDI.disable_cbt', vdiRef)))
  }
}
export default Vm

decorateClass(Vm, {
  checkpoint: defer,
  create: defer,
  export: defer,
  coalesceLeaf: defer,
  snapshot: defer,
})
