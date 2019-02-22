const { cancelable, ignoreErrors, pRetry } = require('promise-toolbox')
const asyncMap = require('@xen-orchestra/async-map').default
const defer = require('golike-defer').default

const AttachedVdiError = require('./_AttachedVdiError')
const extractOpaqueRef = require('./_extractOpaqueRef')
const isValidRef = require('./_isValidRef')
const isVmRunning = require('./_isVmRunning')

module.exports = class {
  @cancelable
  async checkpoint($cancelToken, vmRef, nameLabel) {
    try {
      return await this.callAsync(
        $cancelToken,
        'VM.checkpoint',
        vmRef,
        await this.getField('VM', vmRef, 'name_label')
      ).then(extractOpaqueRef)
    } catch (error) {
      if (error == null || error.code !== 'VM_BAD_POWER_STATE') {
        return this.vm_snapshot(vmRef, nameLabel)
      }
      throw error
    }
  }

  // See https://github.com/xenserver/xenadmin/blob/d9ea36b33d085c4b1d7305908cdb196e8a5e96b6/XenModel/Actions/VM/VMDestroyAction.cs#L71-L131
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
    const disks = (await asyncMap(
      this.getRecords('VBD', vm.VBDs),
      async vbd => {
        let vdiRef
        if (vbd.type === 'Disk' && isValidRef((vdiRef = vbd.VDI))) {
          return vdiRef
        }
      }
    )).filter(_ => _ !== undefined)

    // this cannot be done in parallel, otherwise disks and snapshots will be
    // destroyed even if this fails
    await this.call('VM.destroy', vmRef)

    return Promise.all([
      ignoreErrors.call(asyncMap(vm.snapshots, _ => this.vm_destroy(_))),

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
                  return this.vdi_destroy(vdiRef)
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
  async export($defer, $cancelToken, vmRef, { compress = false } = {}) {
    const vm = await this.getRecord('VM', vmRef)

    const taskRef = await this.task_create('VM export', vm.name_label)
    $defer.onFailure.call(this, 'task_destroy', taskRef)

    const useSnapshot = isVmRunning(vm)
    const exportedVmRef = useSnapshot
      ? await this.vm_snapshot(
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
        this.getRecord('host', this.pool.master),
        useSnapshot ? this.getRecord('VM', exportedVmRef) : vmRef,
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
        this.getRecord('host', this.pool.master),
        this.getRecord('SR', srRef),
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
          let { snapshots } = vm
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
                const prevSnapshotRefs = new Set(snapshots)
                const snapshotNameLabelPrefix = `Snapshot of ${vm.uuid} [`
                snapshots = await this.getField('VM', vm.$ref, 'snapshots')
                const createdSnapshots = (await Promise.all(
                  snapshots
                    .filter(_ => !prevSnapshotRefs.has(_))
                    .map(_ => this.getField('VM', _, 'name_label'))
                )).filter(_ => _.startsWith(snapshotNameLabelPrefix))

                // be safe: only delete if there was a single match
                if (createdSnapshots.length === 1) {
                  ignoreErrors.call(this.vm_destroy(createdSnapshots[0]))
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
