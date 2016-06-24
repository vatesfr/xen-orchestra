import find from 'lodash/find'
import gte from 'lodash/gte'
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
  async createVm (templateId, {
    name_label, // deprecated
    nameLabel = name_label, // eslint-disable-line camelcase

    bootAfterCreate = false,

    clone = true,
    installRepository = undefined,
    vdis = undefined,
    vifs = undefined,
    existingVdis = undefined,

    coreOs = false,
    cloudConfig = undefined,

    ...props
  } = {}) {
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
    const vm = await this._getOrWaitObject(
      await this[clone ? '_cloneVm' : '_copyVm'](template, nameLabel)
    )

    // TODO: copy BIOS strings?

    // Removes disks from the provision XML, we will create them by
    // ourselves.
    await this.call('VM.remove_from_other_config', vm.$ref, 'disks')::pCatch(noop)

    // Creates the VDIs and executes the initial steps of the
    // installation.
    await this.call('VM.provision', vm.$ref)

    // Set VMs params.
    // TODO: checkLimits
    this._editVm(vm, props)

    // Sets boot parameters.
    {
      const isHvm = isVmHvm(vm)

      if (isHvm) {
        if (!vdis.length || installMethod === 'network') {
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

    // Modify existing (previous template) disks if necessary
    existingVdis && await Promise.all(mapToArray(existingVdis, async ({ size, $SR: srId, ...properties }, userdevice) => {
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
    vdis && await Promise.all(mapToArray(vdis, (vdiDescription, i) => {
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
          bootable: installMethod !== 'cd' && !i
        }))
    }))

    // Destroys the VIFs cloned from the template.
    await Promise.all(mapToArray(vm.$VIFs, vif => this._deleteVif(vif)))

    // Creates the VIFs specified by the user.
    if (vifs) {
      const devices = await this.call('VM.get_allowed_VIF_devices', vm.$ref)
      await Promise.all(mapToArray(vifs, (vif, index) => this._createVif(
        vm,
        this.getObject(vif.network),
        {
          device: devices[index],
          mac: vif.mac,
          mtu: vif.mtu
        }
      )))
    }

    // TODO: Assign VGPUs.

    if (cloudConfig != null) {
      // Find the SR of the first VDI.
      let srRef
      forEach(vm.$VBDs, vbd => {
        const vdi = vbd.$VDI
        if (vdi) {
          srRef = vdi.SR
          return false
        }
      })

      const method = coreOs
        ? 'createCoreOsCloudInitConfigDrive'
        : 'createCloudInitConfigDrive'
      await this[method](vm.$id, srRef, cloudConfig)
    }

    if (bootAfterCreate) {
      this._startVm(vm)::pCatch(noop)
    }

    return this._waitObject(vm.$id)
  },

  // High level method to edit a VM.
  //
  // Params do not correspond directly to XAPI props.
  _editVm: makeEditObject({
    auto_poweron: 'autoPoweron',
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

    cpusMax: 'cpusStaticMax',
    cpusStaticMax: {
      constraints: {
        cpus: lte
      },
      get: vm => +vm.VCPUs_max,
      set: 'VCPUs_max'
    },

    cpuWeight: {
      addToLimits: true,
      get: vm => +(vm.VCPUs_params.weight || 0),
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

    name_description: 'nameDescription',
    nameDescription: {
      set: 'name_description'
    },

    name_label: 'nameLabel',
    nameLabel: {
      set: 'name_label'
    },

    pvArgs: {
      get: 'PV_args',
      set: 'PV_args'
    }
  }),

  async editVm (id, props) {
    return /* await */ this._editVm(this.getObject(id), props)
  }
}
