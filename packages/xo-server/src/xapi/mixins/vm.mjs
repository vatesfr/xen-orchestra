import * as xoData from '@xen-orchestra/xapi/xoData.mjs'
import find from 'lodash/find.js'
import gte from 'lodash/gte.js'
import includes from 'lodash/includes.js'
import isEmpty from 'lodash/isEmpty.js'
import keyBy from 'lodash/keyBy.js'
import lte from 'lodash/lte.js'
import forEach from 'lodash/forEach.js'
import mapValues from 'lodash/mapValues.js'
import noop from 'lodash/noop.js'
import { asyncMap } from '@xen-orchestra/async-map'
import { createLogger } from '@xen-orchestra/log'
import { decorateObject } from '@vates/decorate-with'
import { defer as deferrable } from 'golike-defer'
import { ignoreErrors, pCatch } from 'promise-toolbox'
import { Ref } from 'xen-api'

import { parseSize } from '../../utils.mjs'

import { isVmHvm, isVmRunning, makeEditObject } from '../utils.mjs'

const log = createLogger('xo:server:xapi:vm')

// According to: https://xenserver.org/blog/entry/vga-over-cirrus-in-xenserver-6-2.html.
const XEN_VGA_VALUES = ['std', 'cirrus']
const XEN_VIDEORAM_VALUES = [1, 2, 4, 8, 16]

// handle MEMORY_CONSTRAINT_VIOLATION and derivatives like MEMORY_CONSTRAINT_VIOLATION_MAXPIN
const isMemoryConstraintError = e => e.code.startsWith('MEMORY_CONSTRAINT_VIOLATION')

const methods = {
  // TODO: clean up on error.
  async createVm(
    $defer,
    templateId,
    {
      name_label, // eslint-disable-line camelcase
      nameLabel = name_label, // eslint-disable-line camelcase

      clone = true,
      installRepository = undefined,
      vdis = undefined,
      vifs = undefined,
      existingVdis = undefined,

      vgpuType = undefined,
      gpuGroup = undefined,

      copyHostBiosStrings = false,

      ...props
    } = {},
    checkLimits,
    creatorId,
    { destroyAllVifs = false } = {}
  ) {
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
    $defer.onFailure(() => this.VM_destroy(vmRef))

    // Copy BIOS strings
    // https://support.citrix.com/article/CTX230618
    if (
      isEmpty(template.bios_strings) &&
      props.hvmBootFirmware !== 'uefi' &&
      isVmHvm(template) &&
      copyHostBiosStrings
    ) {
      await this.callAsync(
        'VM.copy_bios_strings',
        vmRef,
        this.getObject(props.affinityHost ?? this.getObject(template.$pool).master).$ref
      )
    }

    // Removes disks from the provision XML, we will create them by
    // ourselves.
    await this.call('VM.remove_from_other_config', vmRef, 'disks')::ignoreErrors()

    // Creates the VDIs and executes the initial steps of the
    // installation.
    await this.callAsync('VM.provision', vmRef)

    const vm = await this._getOrWaitObject(vmRef)

    await xoData.set(vm, {
      creation: {
        date: new Date().toISOString(),
        template: template.uuid,
        user: creatorId,
      },
    })

    // Set VMs params.
    await this._editVm(vm, props, checkLimits)

    // Sets boot parameters.
    {
      const isHvm = isVmHvm(vm)

      if (isHvm) {
        if ((isEmpty(vdis) && isEmpty(existingVdis)) || installMethod === 'network') {
          const { order } = vm.HVM_boot_params

          vm.update_HVM_boot_params('order', order ? 'n' + order.replace('n', '') : 'ncd')
        }
      } else {
        // PV
        if (vm.PV_bootloader === 'eliloader') {
          if (installMethod === 'network') {
            // TODO: normalize RHEL URL?

            await vm.update_other_config('install-repository', installRepository)
          } else if (installMethod === 'cd') {
            await vm.update_other_config('install-repository', 'cdrom')
          }
        }
      }
    }

    let hasBootableDisk = false

    // Inserts the CD if necessary.
    if (installMethod === 'cd') {
      // When the VM is started, if PV, the CD drive will become not
      // bootable and the first disk bootable.
      await this._insertCdIntoVm(installRepository, vm, {
        bootable: true,
      })
      hasBootableDisk = true
    }

    // Compatibility with legacy code
    if (existingVdis !== undefined) {
      if (vdis === undefined) {
        vdis = []
      }

      forEach(existingVdis, ({ $SR: sr, ...properties }, userdevice) => {
        const vbd = find(vm.$VBDs, { userdevice })
        if (!vbd) {
          return
        }

        vdis.push({ ...properties, userdevice, sr })
      })
    }
    // End compatibility with legacy code

    if (vdis !== undefined && vdis.length > 0) {
      const _vdisToCreate = []
      const _vdisToUpdate = []
      const _vdisToDestroy = []

      vdis.forEach(({ destroy, ...vdi }) => {
        const { userdevice } = vdi

        if (userdevice === undefined) {
          _vdisToCreate.push(vdi)
          return
        }

        // If the userdevice match no vbd, create the VDI
        const vbd = find(vm.$VBDs, { userdevice })
        if (vbd === undefined) {
          if (destroy) {
            log.warn('VDI ignored because it is marked as "destroy"', vdi)
            return
          }

          _vdisToCreate.push(vdi)
          return
        }

        if (vbd.VDI === Ref.EMPTY) {
          throw new Error(`VBD with userdevice: ${userdevice} exist but has no VDI`)
        }

        vdi.$ref = this.getObject(vbd.VDI).$ref
        if (destroy) {
          _vdisToDestroy.push(vdi)
          return
        }

        _vdisToUpdate.push(vdi)
      })

      await Promise.all(_vdisToDestroy.map(vdi => this.VDI_destroy(vdi.$ref)))

      // Some VBDs may be destroyed with the VDI_destroy. We need to get a fresh VBDs list
      const vbdRefs = await this.getField('VM', vmRef, 'VBDs')
      const vbds = await asyncMap(vbdRefs, vbdRef => this._getOrWaitObject(vbdRef))

      if (!hasBootableDisk) {
        hasBootableDisk = vbds.some(vbd => vbd.bootable)
      }

      // TODO: set vm.suspend_SR
      // Creates the user defined VDIs.
      await Promise.all(
        _vdisToCreate.map(async (vdi, i) => {
          const vdiRef = await this.VDI_create({
            name_description: vdi.name_description,
            name_label: vdi.name_label,
            virtual_size: vdi.size,
            SR: this.getObject(vdi.sr, 'SR').$ref,
          })
          $defer.onFailure(() => this.VDI_destroy(vdiRef))

          // Either the CD or the 1st disk is bootable (only useful for PV VMs)
          let bootable = false
          if (!hasBootableDisk && i === 0) {
            bootable = true
          }
          await this.VBD_create({
            bootable,
            userdevice: vdi.userdevice,
            VDI: vdiRef,
            VM: vm.$ref,
          })
        })
      )

      // Modify existing (previous template) disks if necessary
      // Wait until all VDIs are created, otherwise VBD_create may throw an OTHER_OPERATION_IN_PROGRESS error
      // in case a VDI is migrating
      await Promise.all(
        _vdisToUpdate.map(async ({ $ref, sr, size, userdevice, ...properties }) => {
          await this._setObjectProperties({ $ref, $type: 'VDI' }, properties)

          let _vdi = this.getObject($ref)
          // if another SR is set, move it there
          if (sr !== undefined) {
            _vdi = await this.moveVdi(_vdi.$id, sr)
          }

          // update VDI size if is bigger
          if (size != null) {
            if (size < _vdi.virtual_size) {
              throw new Error(
                `Unable to update to a smaller VDI size for VDI with PBD userdevice: ${userdevice}. Current size: ${_vdi.virtual_size}, new size: ${size}`
              )
            }
            await this.resizeVdi(_vdi.$id, size)
          }
        })
      )
    }

    if (destroyAllVifs) {
      // Destroys the VIFs cloned from the template.
      await Promise.all(vm.$VIFs.map(vif => this._deleteVif(vif)))
    }

    // Creates the VIFs specified by the user.
    if (vifs) {
      const devices = await this.call('VM.get_allowed_VIF_devices', vm.$ref)
      const _vifsToCreate = []
      const _vifsToDestroy = []
      const vmVifByDevice = keyBy(vm.$VIFs, 'device')

      vifs.forEach(vif => {
        if (vif.device === undefined) {
          vif.device = devices.shift()
          _vifsToCreate.push(vif)
          return
        }

        const vmVif = vmVifByDevice[vif.device]
        if (vif.destroy) {
          if (vmVif !== undefined) {
            _vifsToDestroy.push(vmVif)
          }
          return
        }

        if (vmVif !== undefined) {
          _vifsToDestroy.push(vmVif)
        }
        _vifsToCreate.push(vif)
      })

      await Promise.all(_vifsToDestroy.map(vif => this._deleteVif(vif)))
      await Promise.all(
        _vifsToCreate.map(vif =>
          this.VIF_create(
            {
              ipv4_allowed: vif.ipv4_allowed,
              ipv6_allowed: vif.ipv6_allowed,
              device: vif.device,
              locking_mode: isEmpty(vif.ipv4_allowed) && isEmpty(vif.ipv6_allowed) ? 'network_default' : 'locked',
              MTU: vif.mtu,
              network: this.getObject(vif.network).$ref,
              VM: vm.$ref,
            },
            {
              MAC: vif.mac,
            }
          )
        )
      )
    }

    if (vgpuType !== undefined && gpuGroup !== undefined) {
      await this.createVgpu(vm, gpuGroup, vgpuType)
    }

    // wait for the record with all the VBDs and VIFs
    return this.barrier(vm.$ref)
  },

  // High level method to edit a VM.
  //
  // Params do not correspond directly to XAPI props.
  _editVm: makeEditObject({
    affinityHost: {
      get: 'affinity',
      set: (value, vm) => vm.set_affinity(value ? vm.$xapi.getObject(value).$ref : Ref.EMPTY),
    },

    autoPoweron: {
      set(value, vm) {
        return Promise.all([
          vm.update_other_config('auto_poweron', value ? 'true' : null),
          value && vm.$pool.update_other_config('auto_poweron', 'true'),
        ])
      },
    },

    blockedOperations: {
      set(operations, vm) {
        return vm.update_blocked_operations(
          mapValues(operations, value => (typeof value === 'string' ? value : value ? 'true' : null))
        )
      },
    },

    virtualizationMode: {
      set(virtualizationMode, vm) {
        if (virtualizationMode !== 'pv' && virtualizationMode !== 'hvm') {
          throw new Error(`The virtualization mode must be 'pv' or 'hvm'`)
        }
        return vm.set_domain_type !== undefined
          ? vm.set_domain_type(virtualizationMode)
          : vm.set_HVM_boot_policy(virtualizationMode === 'hvm' ? 'Boot order' : '')
      },
    },

    coresPerSocket: {
      set: (coresPerSocket, vm) =>
        vm.update_platform('cores-per-socket', coresPerSocket !== null ? String(coresPerSocket) : null),
    },

    CPUs: 'cpus',
    cpus: {
      addToLimits: true,

      // Current value may have constraints with other values.
      //
      // If the other value is not set and the constraint is not
      // respected, the other value is changed first.
      constraints: {
        cpusStaticMax: gte,
      },

      get: vm => +vm.VCPUs_at_startup,
      set: [
        'VCPUs_at_startup',
        (value, vm) => isVmRunning(vm) && vm.$xapi.call('VM.set_VCPUs_number_live', vm.$ref, String(value)),
      ],
    },

    cpuCap: {
      get: vm => vm.VCPUs_params.cap && +vm.VCPUs_params.cap,
      set: (cap, vm) => vm.update_VCPUs_params('cap', cap !== null ? String(cap) : null),
    },

    cpuMask: {
      get: vm => vm.VCPUs_params.mask && vm.VCPUs_params.mask.split(','),
      set: (cpuMask, vm) => vm.update_VCPUs_params('mask', cpuMask == null ? cpuMask : cpuMask.join(',')),
    },

    cpusMax: 'cpusStaticMax',
    cpusStaticMax: {
      constraints: {
        cpus: lte,
      },
      get: vm => +vm.VCPUs_max,
      set: 'VCPUs_max',
    },

    cpuWeight: {
      get: vm => vm.VCPUs_params.weight && +vm.VCPUs_params.weight,
      set: (weight, vm) => vm.update_VCPUs_params('weight', weight === null ? null : String(weight)),
    },

    highAvailability: {
      set: (ha, vm) => vm.set_ha_restart_priority(ha),
    },

    memoryMin: {
      constraints: {
        memoryMax: gte,
      },
      get: vm => +vm.memory_dynamic_min,
      preprocess: parseSize,
      set: 'memory_dynamic_min',
    },

    _memory: {
      addToLimits: true,
      get: vm => +vm.memory_dynamic_max,
      preprocess: parseSize,
      set(memory, vm) {
        return vm.$call('set_memory_limits', vm.memory_static_min, memory, memory, memory)
      },
    },

    memory: {
      dispatch(vm) {
        const dynamicMin = vm.memory_dynamic_min
        const useDmc = dynamicMin !== vm.memory_dynamic_max || dynamicMin !== vm.memory_static_max

        return useDmc ? 'memoryMax' : '_memory'
      },
    },

    memoryMax: {
      addToLimits: true,
      limitName: 'memory',
      get: vm => +vm.memory_dynamic_max,
      preprocess: parseSize,
      set(dynamicMax, vm) {
        const { $ref } = vm
        const dynamicMin = Math.min(vm.memory_dynamic_min, dynamicMax)

        if (isVmRunning(vm)) {
          return this.call('VM.set_memory_dynamic_range', $ref, dynamicMin, dynamicMax)::pCatch(
            isMemoryConstraintError,
            () => {
              throw new Error('Cannot change memory on running VM')
            }
          )
        }

        const staticMin = Math.min(vm.memory_static_min, dynamicMax)
        return this.call(
          'VM.set_memory_limits',
          $ref,
          staticMin,
          Math.max(dynamicMax, vm.memory_static_max),
          dynamicMin,
          dynamicMax
        )::pCatch(isMemoryConstraintError, () =>
          this.call('VM.set_memory_limits', $ref, staticMin, dynamicMax, dynamicMax, dynamicMax)
        )
      },
    },

    memoryStaticMax: {
      constraints: {
        memoryMax: lte,
      },
      get: vm => +vm.memory_static_max,
      preprocess: parseSize,
      set: 'memory_static_max',
    },

    nameDescription: true,

    nameLabel: true,

    notes: {
      get: vm => vm.other_config['xo:notes'],
      set: (value, vm) => vm.update_other_config('xo:notes', value),
    },

    PV_args: true,

    tags: true,

    hasVendorDevice: true,

    expNestedHvm: {
      set: (expNestedHvm, vm) => vm.update_platform('exp-nested-hvm', expNestedHvm ? 'true' : null),
    },

    nicType: {
      set: (nicType, vm) => vm.update_platform('nic_type', nicType),
    },

    vga: {
      set(vga, vm) {
        if (!includes(XEN_VGA_VALUES, vga)) {
          throw new Error(`The different values that the VGA can take are: ${XEN_VGA_VALUES}`)
        }
        return vm.update_platform('vga', vga)
      },
    },

    videoram: {
      set(videoram, vm) {
        if (!includes(XEN_VIDEORAM_VALUES, videoram)) {
          throw new Error(`The different values that the video RAM can take are: ${XEN_VIDEORAM_VALUES}`)
        }
        return vm.update_platform('videoram', String(videoram))
      },
    },
    viridian: {
      set: (viridian, vm) => vm.update_platform('viridian', viridian ? 'true' : null),
    },

    startDelay: {
      get: vm => +vm.start_delay,
      set: (startDelay, vm) => vm.set_start_delay(startDelay),
    },
    secureBoot: {
      set: (secureBoot, vm) => vm.update_platform('secureboot', secureBoot.toString()),
    },
    hvmBootFirmware: {
      set: (firmware, vm) =>
        Promise.all([
          vm.update_HVM_boot_params('firmware', firmware),
          vm.update_platform('device-model', 'qemu-upstream-' + (firmware === 'uefi' ? 'uefi' : 'compat')),
        ]),
    },
  }),

  async editVm(id, props, checkLimits) {
    return /* await */ this._editVm(this.getObject(id), props, checkLimits)
  },

  async revertVm(snapshotId) {
    const snapshot = this.getObject(snapshotId)
    await this.callAsync('VM.revert', snapshot.$ref)
    if (snapshot.snapshot_info['power-state-at-snapshot'] === 'Running') {
      const vm = await this.barrier(snapshot.snapshot_of)
      if (vm.power_state === 'Halted') {
        this.startVm(vm.$id)::ignoreErrors()
      } else if (vm.power_state === 'Suspended') {
        this.resumeVm(vm.$id)::ignoreErrors()
      }
    }
  },

  async resumeVm(vmId) {
    // the force parameter is always true
    await this.callAsync('VM.resume', this.getObject(vmId).$ref, false, true)
  },

  async unpauseVm(vmId) {
    await this.callAsync('VM.unpause', this.getObject(vmId).$ref)
  },

  rebootVm(vmId, { hard = false } = {}) {
    return this.callAsync(`VM.${hard ? 'hard' : 'clean'}_reboot`, this.getObject(vmId).$ref).then(noop)
  },

  shutdownVm(vmId, { hard = false } = {}) {
    return this.callAsync(`VM.${hard ? 'hard' : 'clean'}_shutdown`, this.getObject(vmId).$ref).then(noop)
  },
}

export default decorateObject(methods, {
  createVm: deferrable,
})
