import deferrable from 'golike-defer'
import find from 'lodash/find'
import gte from 'lodash/gte'
import isEmpty from 'lodash/isEmpty'
import lte from 'lodash/lte'

import {
  forEach,
  mapToArray,
  noop,
  parseSize,
  pCatch
} from '../../utils'

import {
  isVmHvm,
  isVmRunning,
  makeEditObject
} from '../utils'

export default {
  // TODO: clean up on error.
  @deferrable.onFailure
  async createVm ($onFailure, templateId, {
    name_label, // deprecated
    nameLabel = name_label, // eslint-disable-line camelcase

    clone = true,
    installRepository = undefined,
    vdis = undefined,
    vifs = undefined,
    existingVdis = undefined,

    coreOs = false,
    cloudConfig = undefined,

    ...props
  } = {}, checkLimits) {
    const installMethod = (() => {
      if (installRepository == null) {
        return 'none'
      }

      try {
        installRepository = this.getObject(installRepository)
        return 'cd'
      } catch (_) {
        return 'network'
      }
    })()
    const template = this.getObject(templateId)

    // Clones the template.
    const vmRef = await this[clone ? '_cloneVm' : '_copyVm'](template, nameLabel)
    $onFailure(() => this.deleteVm(vmRef, true)::pCatch(noop))

    // TODO: copy BIOS strings?

    // Removes disks from the provision XML, we will create them by
    // ourselves.
    await this.call('VM.remove_from_other_config', vmRef, 'disks')::pCatch(noop)

    // Creates the VDIs and executes the initial steps of the
    // installation.
    await this.call('VM.provision', vmRef)

    let vm = await this._getOrWaitObject(vmRef)

    // Set VMs params.
    await this._editVm(vm, props, checkLimits)

    // Sets boot parameters.
    {
      const isHvm = isVmHvm(vm)

      if (isHvm) {
        if (!isEmpty(vdis) || installMethod === 'network') {
          const { HVM_boot_params: bootParams } = vm
          let order = bootParams.order
          if (order) {
            order = 'n' + order.replace('n', '')
          } else {
            order = 'ncd'
          }

          this._setObjectProperties(vm, {
            HVM_boot_params: { ...bootParams, order }
          })
        }
      } else { // PV
        if (vm.PV_bootloader === 'eliloader') {
          if (installMethod === 'network') {
            // TODO: normalize RHEL URL?

            await this._updateObjectMapProperty(vm, 'other_config', {
              'install-repository': installRepository
            })
          } else if (installMethod === 'cd') {
            await this._updateObjectMapProperty(vm, 'other_config', {
              'install-repository': 'cdrom'
            })
          }
        }
      }
    }

    // Inserts the CD if necessary.
    if (installMethod === 'cd') {
      // When the VM is started, if PV, the CD drive will become not
      // bootable and the first disk bootable.
      await this._insertCdIntoVm(installRepository, vm, {
        bootable: true
      })
    }

    let nDisks = 0

    // Modify existing (previous template) disks if necessary
    existingVdis && await Promise.all(mapToArray(existingVdis, async ({ size, $SR: srId, ...properties }, userdevice) => {
      ++nDisks

      const vbd = find(vm.$VBDs, { userdevice })
      if (!vbd) {
        return
      }
      const vdi = vbd.$VDI
      await this._setObjectProperties(vdi, properties)

      // if the disk is bigger
      if (
        size != null &&
        size > vdi.virtual_size
      ) {
        await this.resizeVdi(vdi.$id, size)
      }
      // if another SR is set, move it there
      if (srId) {
        await this.moveVdi(vdi.$id, srId)
      }
    }))

    // Creates the user defined VDIs.
    //
    // TODO: set vm.suspend_SR
    if (!isEmpty(vdis)) {
      const devices = await this.call('VM.get_allowed_VBD_devices', vm.$ref)
      await Promise.all(mapToArray(vdis, (vdiDescription, i) => {
        ++nDisks

        return this._createVdi(
          vdiDescription.size, // FIXME: Should not be done in Xapi.
          {
            name_label: vdiDescription.name_label,
            name_description: vdiDescription.name_description,
            sr: vdiDescription.sr || vdiDescription.SR
          }
        )
          .then(ref => this._getOrWaitObject(ref))
          .then(vdi => this._createVbd(vm, vdi, {
            // Only the first VBD if installMethod is not cd is bootable.
            bootable: installMethod !== 'cd' && !i,

            userdevice: devices[i]
          }))
      }))
    }

    // Destroys the VIFs cloned from the template.
    await Promise.all(mapToArray(vm.$VIFs, vif => this._deleteVif(vif)))

    // Creates the VIFs specified by the user.
    if (vifs) {
      const devices = await this.call('VM.get_allowed_VIF_devices', vm.$ref)
      await Promise.all(mapToArray(vifs, (vif, index) => this._createVif(
        vm,
        this.getObject(vif.network),
        {
          ipv4_allowed: vif.ipv4_allowed,
          ipv6_allowed: vif.ipv6_allowed,
          device: devices[index],
          locking_mode: isEmpty(vif.ipv4_allowed) && isEmpty(vif.ipv6_allowed) ? 'network_default' : 'locked',
          mac: vif.mac,
          mtu: vif.mtu
        }
      )))
    }

    // TODO: Assign VGPUs.

    if (cloudConfig != null) {
      // Refresh the record.
      vm = await this._waitObject(vm.$id, vm => vm.VBDs.length === nDisks)

      // Find the SR of the first VDI.
      let srRef
      forEach(vm.$VBDs, vbd => {
        let vdi
        if (
          vbd.type === 'Disk' &&
          (vdi = vbd.$VDI)
        ) {
          srRef = vdi.SR
          return false
        }
      })

      const method = coreOs
        ? 'createCoreOsCloudInitConfigDrive'
        : 'createCloudInitConfigDrive'
      await this[method](vm.$id, srRef, cloudConfig)
    }

    return this._waitObject(vm.$id)
  },

  // High level method to edit a VM.
  //
  // Params do not correspond directly to XAPI props.
  _editVm: makeEditObject({
    autoPoweron: {
      set (value, vm) {
        return Promise.all([
          this._updateObjectMapProperty(vm, 'other_config', {
            autoPoweron: value ? 'true' : null
          }),
          value && this.setPoolProperties({
            autoPoweron: true
          })
        ])
      }
    },

    CPUs: 'cpus',
    cpus: {
      addToLimits: true,

      // Current value may have constraints with other values.
      //
      // If the other value is not set and the constraint is not
      // respected, the other value is changed first.
      constraints: {
        cpusStaticMax: gte
      },

      get: vm => +vm.VCPUs_at_startup,
      set: [
        'VCPUs_at_startup',
        function (value, vm) {
          return isVmRunning(vm) && this._set('VCPUs_number_live', value)
        }
      ]
    },

    cpuCap: {
      get: vm => vm.VCPUs_params.cap && +vm.VCPUs_params.cap,
      set (cap, vm) {
        return this._updateObjectMapProperty(vm, 'VCPUs_params', { cap })
      }
    },

    cpusMax: 'cpusStaticMax',
    cpusStaticMax: {
      constraints: {
        cpus: lte
      },
      get: vm => +vm.VCPUs_max,
      set: 'VCPUs_max'
    },

    cpuWeight: {
      get: vm => vm.VCPUs_params.weight && +vm.VCPUs_params.weight,
      set (weight, vm) {
        return this._updateObjectMapProperty(vm, 'VCPUs_params', { weight })
      }
    },

    highAvailability: {
      set (ha, vm) {
        return this.call('VM.set_ha_restart_priority', vm.$ref, ha ? 'restart' : '')
      }
    },

    memoryMin: {
      constraints: {
        memoryMax: gte
      },
      get: vm => +vm.memory_dynamic_min,
      preprocess: parseSize,
      set: 'memory_dynamic_min'
    },

    memory: 'memoryMax',
    memoryMax: {
      addToLimits: true,
      limitName: 'memory',
      constraints: {
        memoryMin: lte,
        memoryStaticMax: gte
      },
      get: vm => +vm.memory_dynamic_max,
      preprocess: parseSize,
      set: 'memory_dynamic_max'
    },

    memoryStaticMax: {
      constraints: {
        memoryMax: lte
      },
      get: vm => +vm.memory_static_max,
      preprocess: parseSize,
      set: 'memory_static_max'
    },

    nameDescription: true,

    nameLabel: true,

    PV_args: true,

    tags: true
  }),

  async editVm (id, props, checkLimits) {
    return /* await */ this._editVm(this.getObject(id), props, checkLimits)
  },

  async revertVm (snapshotId, snapshotBefore = true) {
    const snapshot = this.getObject(snapshotId)
    if (snapshotBefore) {
      await this._snapshotVm(snapshot.$snapshot_of)
    }
    return this.call('VM.revert', snapshot.$ref)
  }
}
