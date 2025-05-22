/* eslint-env jest */

import { map, size } from 'lodash'

// eslint-disable-next-line n/no-missing-import
import { config, rejectionOf, waitObjectState, xo } from './../util'

// ===================================================================

beforeAll(async () => {
  jest.setTimeout(150e3)
})

describe('the VM life cycle', () => {
  const vmsToDelete = []
  // hvm with tools behave like pv vm
  let hvmWithToolsId
  let hvmWithoutToolsId

  // ----------------------------------------------------------------------

  beforeAll(async () => {
    hvmWithToolsId = await xo.call('vm.create', {
      name_label: 'vmTest-updateState',
      template: config.templatesId.debianCloud,
      VIFs: [{ network: config.labPoolNetworkId }],
      VDIs: [
        {
          device: '0',
          size: 1,
          SR: config.labPoolSrId,
          type: 'user',
        },
      ],
    })
    vmsToDelete.push(hvmWithToolsId)
    await waitObjectState(xo, hvmWithToolsId, vm => {
      if (vm.type !== 'VM') throw new Error('retry')
    })

    hvmWithoutToolsId = await xo.call('vm.create', {
      name_label: 'vmTest-updateState',
      template: config.templatesId.centOS,
      VIFs: [{ network: config.labPoolNetworkId }],
      VDIs: [
        {
          device: '0',
          size: 1,
          SR: config.labPoolSrId,
          type: 'user',
        },
      ],
    })
    vmsToDelete.push(hvmWithoutToolsId)
    await waitObjectState(xo, hvmWithoutToolsId, vm => {
      if (vm.type !== 'VM') throw new Error('retry')
    })
  })

  afterAll(async () => {
    await Promise.all(
      map(vmsToDelete, id => xo.call('vm.delete', { id, delete_disks: true }).catch(error => console.error(error)))
    )
    vmsToDelete.length = 0
  })

  // =================================================================

  describe('.start()', () => {
    it('starts a VM', async () => {
      await xo.call('vm.start', { id: hvmWithToolsId })

      await waitObjectState(xo, hvmWithToolsId, vm => {
        expect(size(vm.current_operations)).toBe(0)
        expect(vm.power_state).toBe('Running')
        expect(vm.startTime).not.toBe(0)
        expect(vm.xenTools).not.toBeFalsy()
      })
    })
  })

  describe('.sets() on a running VM', () => {
    it('sets VM parameters', async () => {
      await xo.call('vm.set', {
        id: hvmWithToolsId,
        name_label: 'startedVmRenamed',
        name_description: 'test started vm',
        high_availability: true,
        CPUs: 1,
        memoryMin: 260e6,
      })

      await waitObjectState(xo, hvmWithToolsId, vm => {
        expect(vm.name_label).toBe('startedVmRenamed')
        expect(vm.name_description).toBe('test started vm')
        expect(vm.high_availability).toBeTruthy()
        expect(vm.CPUs.number).toBe(1)
        expect(vm.memory.dynamic[0]).toBe(260e6)
      })
    })
  })

  describe('.restart()', () => {
    it('restarts a VM (clean reboot)', async () => {
      await xo.call('vm.restart', {
        id: hvmWithToolsId,
        force: false,
      })

      await waitObjectState(xo, hvmWithToolsId, vm => {
        expect(size(vm.current_operations)).toBe(0)
        expect(vm.power_state).toBe('Running')
        expect(vm.startTime).not.toBe(0)
        expect(vm.xenTools).not.toBeFalsy()
      })
    })

    it('restarts a VM without PV drivers(clean reboot)', async () => {
      await xo.call('vm.start', { id: hvmWithoutToolsId })
      await waitObjectState(xo, hvmWithoutToolsId, vm => {
        if (size(vm.current_operations) !== 0 || vm.power_state !== 'Running') throw new Error('retry')
      })

      expect(
        (
          await rejectionOf(
            xo.call('vm.restart', {
              id: hvmWithoutToolsId,
              force: false,
            })
          )
        ).message
      ).toBe('VM lacks feature shutdown')
    })

    it('restarts a VM (hard reboot)', async () => {
      await xo.call('vm.restart', {
        id: hvmWithToolsId,
        force: true,
      })

      await waitObjectState(xo, hvmWithToolsId, vm => {
        expect(size(vm.current_operations)).toBe(0)
        expect(vm.power_state).toBe('Running')
        expect(vm.startTime).not.toBe(0)
        expect(vm.xenTools).not.toBeFalsy()
      })
    })
  })

  describe('.suspend()', () => {
    it('suspends a VM', async () => {
      await xo.call('vm.suspend', { id: hvmWithToolsId })

      await waitObjectState(xo, hvmWithToolsId, vm => {
        expect(size(vm.current_operations)).toBe(0)
        expect(vm.power_state).toBe('Suspended')
      })
    })
  })

  describe('.resume()', () => {
    it('resumes a VM', async () => {
      await xo.call('vm.resume', { id: hvmWithToolsId })

      await waitObjectState(xo, hvmWithToolsId, vm => {
        expect(size(vm.current_operations)).toBe(0)
        expect(vm.power_state).toBe('Running')
        expect(vm.startTime).not.toBe(0)
        expect(vm.xenTools).not.toBeFalsy()
      })
    })
  })

  describe('.stop()', () => {
    it('stops a VM (clean shutdown)', async () => {
      await xo.call('vm.stop', {
        id: hvmWithToolsId,
        force: false,
      })

      await waitObjectState(xo, hvmWithToolsId, vm => {
        expect(size(vm.current_operations)).toBe(0)
        expect(vm.power_state).toBe('Halted')
        expect(vm.startTime).toBe(0)
      })
    })

    it('stops a VM without PV drivers (clean shutdown)', async () => {
      await xo.call('vm.start', { id: hvmWithoutToolsId })
      await waitObjectState(xo, hvmWithoutToolsId, vm => {
        if (size(vm.current_operations) !== 0 || vm.power_state !== 'Running') throw new Error('retry')
      })

      expect(
        (
          await rejectionOf(
            xo.call('vm.stop', {
              id: hvmWithoutToolsId,
              force: false,
            })
          )
        ).message
      ).toBe('clean shutdown requires PV drivers')
    })

    it('stops a VM (hard shutdown)', async () => {
      await xo.call('vm.start', { id: hvmWithToolsId })
      await waitObjectState(xo, hvmWithToolsId, vm => {
        if (size(vm.current_operations) !== 0 || vm.startTime === 0) throw new Error('retry')
      })

      await xo.call('vm.stop', {
        id: hvmWithToolsId,
        force: true,
      })

      await waitObjectState(xo, hvmWithToolsId, vm => {
        expect(size(vm.current_operations)).toBe(0)
        expect(vm.power_state).toBe('Halted')
        expect(vm.startTime).toBe(0)
      })
    })
  })

  describe('.sets() on a halted VM', () => {
    it('sets VM parameters', async () => {
      await xo.call('vm.set', {
        id: hvmWithToolsId,
        name_label: 'haltedVmRenamed',
        name_description: 'test halted vm',
        high_availability: true,
        CPUs: 1,
        memoryMin: 20e8,
        memoryMax: 90e8,
        memoryStaticMax: 100e8,
      })

      await waitObjectState(xo, hvmWithToolsId, vm => {
        expect(vm.name_label).toBe('haltedVmRenamed')
        expect(vm.name_description).toBe('test halted vm')
        expect(vm.high_availability).toBeTruthy()
        expect(vm.CPUs.number).toBe(1)
        expect(vm.memory.dynamic[0]).toBe(20e8)
        expect(vm.memory.dynamic[1]).toBe(90e8)
        expect(vm.memory.static[1]).toBe(100e8)
      })
    })
  })

  describe('.recoveryStart()', () => {
    it('start a VM in recovery state', async () => {
      await xo.call('vm.recoveryStart', { id: hvmWithToolsId })

      await waitObjectState(xo, hvmWithToolsId, vm => {
        expect(vm.boot.order).toBe('d')
      })

      await waitObjectState(xo, hvmWithToolsId, vm => {
        expect(size(vm.current_operations)).toBe(0)
        expect(vm.power_state).toBe('Running')
        expect(vm.boot.order).not.toBe('d')
      })
    })
  })
})
