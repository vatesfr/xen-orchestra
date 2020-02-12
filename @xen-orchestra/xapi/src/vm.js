const asyncMap = require('@xen-orchestra/async-map').default
const cancelable = require('promise-toolbox/cancelable')
const defer = require('golike-defer').default
const groupBy = require('lodash/groupBy')
const ignoreErrors = require('promise-toolbox/ignoreErrors')
const pRetry = require('promise-toolbox/retry')
const { NULL_REF } = require('xen-api')

const AttachedVdiError = require('./_AttachedVdiError')
const extractOpaqueRef = require('./_extractOpaqueRef')
const isValidRef = require('./_isValidRef')
const isVmRunning = require('./_isVmRunning')

async function safeGetRecord(xapi, type, ref) {
  try {
    return await xapi.getRecord(type, ref)
  } catch (_) {
    return ref
  }
}

module.exports = class Vm {
  async _assertHealthyVdiChain(vdiRef, cache, tolerance) {
    let vdi = cache[vdiRef]
    if (vdi === undefined) {
      vdi = await this.getRecord('VDI', vdiRef)
      cache[vdiRef] = vdi
      cache[vdi.uuid] = vdi
    }

    if (!vdi.managed) {
      const srRef = vdi.SR
      let childrenMap = cache[srRef]
      if (childrenMap === undefined) {
        const vdiRefs = await this.getField('SR', srRef, 'VDIs')
        childrenMap = groupBy(
          await Promise.all(
            vdiRefs.map(async vdiRef => {
              let vdi = cache[vdiRef]
              if (vdi === undefined) {
                vdi = await this.getRecord('VDI', vdiRef)
                cache[vdiRef] = vdi
                cache[vdi.uuid] = vdi
              }
              return vdi
            })
          ),
          vdi => vdi.sm_config['vhd-parent']
        )
      }

      // an unmanaged VDI should not have exactly one child: they
      // should coalesce
      const children = childrenMap[vdi.uuid]
      if (
        children.length === 1 &&
        !children[0].managed && // some SRs do not coalesce the leaf
        tolerance-- <= 0
      ) {
        throw new Error('unhealthy VDI chain')
      }
    }

    const parentUuid = vdi.sm_config['vhd-parent']
    if (parentUuid !== undefined) {
      let parent = cache[parentUuid]
      if (parent === undefined) {
        parent = await this.getRecordByUuid('VDI', parentUuid)
        cache[parent.$ref] = parent
        cache[parentUuid] = parent
      }
      return this._assertHealthyVdiChain(parent.$ref, cache, tolerance)
    }
  }

  async assertHealthyVdiChains(vmRef, tolerance = this._maxUncoalescedVdis) {
    const vdiRefs = {}
    ;(
      await this.getRecords('VBD', await this.getField('VM', vmRef, 'VBDs'))
    ).forEach(({ VDI: ref }) => {
      if (isValidRef(ref)) {
        vdiRefs[ref] = true
      }
    })
    const cache = { __proto__: null }
    for (const vdiRef of Object.keys(vdiRefs)) {
      await this._assertHealthyVdiChain(vdiRef, cache, tolerance)
    }
  }

  // @cancelable
  // async checkpoint($cancelToken, vmRef, nameLabel) {
  //   try {
  //     return await this.callAsync(
  //       $cancelToken,
  //       'VM.checkpoint',
  //       vmRef,
  //       await this.getField('VM', vmRef, 'name_label')
  //     ).then(extractOpaqueRef)
  //   } catch (error) {
  //     if (error == null || error.code !== 'VM_BAD_POWER_STATE') {
  //       return this.VM_snapshot(vmRef, nameLabel)
  //     }
  //     throw error
  //   }
  // }

  create(
    {
      actions_after_crash = 'reboot',
      actions_after_reboot = 'reboot',
      actions_after_shutdown = 'destroy',
      affinity = NULL_REF,
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
      // NVRAM, // experimental
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
      // if set, will create the VM in Suspended power_state with this VDI
      //
      // it's a separate param because it's not supported for all versions of
      // XCP-ng/XenServer and should be passed explicitly
      suspend_VDI,
    } = {}
  ) {
    return this.call('VM.create', {
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
      other_config,
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
      HVM_shadow_multiplier,
      is_vmss_snapshot,
      name_description,
      name_label,
      order,
      reference_label,
      shutdown_delay,
      snapshot_schedule,
      start_delay,
      suspend_SR,
      tags,
      version,
      xenstore_data,

      // VM created Suspended
      last_boot_CPU_flags,
      last_booted_record,
      power_state: suspend_VDI !== undefined ? 'Suspended' : undefined,
      suspend_VDI,
    })
  }

  async destroy(
    vmRef,
    {
      deleteDisks = true,
      force = false,
      forceDeleteDefaultTemplate = false,
    } = {}
  ) {
    const vm = await this.getRecord('VM', vmRef)
    if (!force && 'destroy' in vm.blocked_operations) {
      throw new Error('destroy is blocked')
    }
    if (
      !forceDeleteDefaultTemplate &&
      vm.other_config.default_template === 'true'
    ) {
      throw new Error('VM is default template')
    }
    // It is necessary for suspended VMs to be shut down
    // to be able to delete their VDIs.
    if (vm.power_state !== 'Halted') {
      await this.call('VM.hard_shutdown', vmRef)
    }
    await Promise.all([
      vm.set_is_a_template(false),
      vm.update_blocked_operations('destroy', null),
      vm.update_other_config('default_template', null),
    ])
    // must be done before destroying the VM
    const disks = (
      await asyncMap(this.getRecords('VBD', vm.VBDs), async vbd => {
        let vdiRef
        if (vbd.type === 'Disk' && isValidRef((vdiRef = vbd.VDI))) {
          return vdiRef
        }
      })
    ).filter(_ => _ !== undefined)
    // this cannot be done in parallel, otherwise disks and snapshots will be
    // destroyed even if this fails
    await this.call('VM.destroy', vmRef)
    return Promise.all([
      ignoreErrors.call(asyncMap(vm.snapshots, _ => this.VM_destroy(_))),
      deleteDisks &&
        ignoreErrors.call(
          asyncMap(disks, vdiRef =>
            pRetry(
              async () => {
                // list VMs connected to this VDI
                const vmRefs = await asyncMap(
                  this.getField('VDI', vdiRef, 'VBDs'),
                  vbdRef => this.getField('VBD', vbdRef, 'VM')
                )
                if (vmRefs.every(_ => _ === vmRef)) {
                  return this.callAsync('VDI.destroy', vdiRef)
                }
                throw new AttachedVdiError()
              },
              {
                delay: 5e3,
                tries: 2,
                when: AttachedVdiError,
              }
            )
          )
        ),
    ])
  }

  @cancelable
  @defer
  async export(
    $defer,
    $cancelToken,
    vmRef,
    { compress = false, useSnapshot } = {}
  ) {
    const vm = await this.getRecord('VM', vmRef)
    const taskRef = await this.task_create('VM export', vm.name_label)
    $defer.onFailure.call(this, 'task_destroy', taskRef)
    if (useSnapshot === undefined) {
      useSnapshot = isVmRunning(vm)
    }
    const exportedVmRef = useSnapshot
      ? await this.VM_snapshot(
          $cancelToken,
          vmRef,
          `[XO Export] ${vm.name_label}`
        )
      : vmRef
    try {
      return await this.getResource($cancelToken, '/export/', {
        query: {
          ref: exportedVmRef,
          use_compression:
            compress === 'zstd'
              ? 'zstd'
              : compress === true || compress === 'gzip'
              ? 'true'
              : 'false',
        },
        task: taskRef,
      })
    } catch (error) {
      // augment the error with as much relevant info as possible
      const [poolMaster, exportedVm] = await Promise.all([
        safeGetRecord(this, 'host', this.pool.master),
        useSnapshot ? safeGetRecord(this, 'VM', exportedVmRef) : vmRef,
      ])
      error.pool_master = poolMaster
      error.VM = exportedVm
      throw error
    } finally {
    }
    // if (useSnapshot) {
    //   const destroySnapshot = () => this.deleteVm(exportedVm)::ignoreErrors()
    //   promise.then(_ => _.task::pFinally(destroySnapshot), destroySnapshot)
    // }
    //
    // return promise
  }

  async getDisks(vmRef) {
    const disks = { __proto__: null }
    ;(await this.getField('VM', vmRef, 'VBDs')).forEach(vbd => {
      if (vbd.type === 'Disk' && isValidRef(vbd.VDI)) {
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
    // FIXME
    if (onVmCreation != null) {
      ignoreErrors.call(
        this._waitObject(
          obj =>
            obj != null &&
            obj.current_operations != null &&
            taskRef in obj.current_operations
        ).then(onVmCreation)
      )
    }
    try {
      return await this.putResource(stream, '/import/', {
        query,
        task: taskRef,
      }).then(extractOpaqueRef)
    } catch (error) {
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

  @cancelable
  async snapshot($cancelToken, vmRef, nameLabel) {
    const vm = await this.getRecord('VM', vmRef)
    if (nameLabel === undefined) {
      nameLabel = vm.name_label
    }
    let ref
    do {
      if (!vm.tags.includes('xo-disable-quiesce')) {
        try {
          ref = await pRetry(
            async bail => {
              try {
                return await this.callAsync(
                  $cancelToken,
                  'VM.snapshot_with_quiesce',
                  vmRef,
                  nameLabel
                )
              } catch (error) {
                if (
                  error == null ||
                  error.code !== 'VM_SNAPSHOT_WITH_QUIESCE_FAILED'
                ) {
                  throw bail(error)
                }
                // detect and remove new broken snapshots
                //
                // see https://github.com/vatesfr/xen-orchestra/issues/3936
                const prevSnapshotRefs = new Set(vm.snapshots)
                const snapshotNameLabelPrefix = `Snapshot of ${vm.uuid} [`
                await vm.refresh_snapshots()
                const createdSnapshots = (
                  await this.getRecords(
                    'VM',
                    vm.snapshots.filter(_ => !prevSnapshotRefs.has(_))
                  )
                ).filter(_ => _.name_label.startsWith(snapshotNameLabelPrefix))
                // be safe: only delete if there was a single match
                if (createdSnapshots.length === 1) {
                  ignoreErrors.call(this.VM_destroy(createdSnapshots[0]))
                }
                throw error
              }
            },
            {
              delay: 60e3,
              tries: 3,
            }
          ).then(extractOpaqueRef)
          ignoreErrors.call(this.call('VM.add_tags', ref, 'quiesce'))
          break
        } catch (error) {
          const { code } = error
          if (
            // removed in CH 8.1
            code !== 'MESSAGE_REMOVED' &&
            code !== 'VM_SNAPSHOT_WITH_QUIESCE_NOT_SUPPORTED' &&
            // quiesce only work on a running VM
            code !== 'VM_BAD_POWER_STATE' &&
            // quiesce failed, fallback on standard snapshot
            // TODO: emit warning
            code !== 'VM_SNAPSHOT_WITH_QUIESCE_FAILED'
          ) {
            throw error
          }
        }
      }
      ref = await this.callAsync(
        $cancelToken,
        'VM.snapshot',
        vmRef,
        nameLabel
      ).then(extractOpaqueRef)
    } while (false)
    await this.setField('VM', ref, 'is_a_template', false)
    return ref
  }
}
