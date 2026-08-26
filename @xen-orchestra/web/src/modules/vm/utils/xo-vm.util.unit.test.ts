import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import {
  areAllVmsHavingPowerState,
  areVmsOperationPending,
  extractVmHostId,
  getVmIpAddresses,
  getVmsPendingOperation,
  isVmOperationPending,
  notAllVmsHavingPowerState,
} from '@/modules/vm/utils/xo-vm.util.ts'
import { createVm } from '@/test/create-vm.ts'
import { VM_OPERATIONS, VM_POWER_STATE } from '@vates/types'

describe('isVmOperationPending', () => {
  it('matches a single operation', () => {
    const vm = createVm({ current_operations: { 'task-1': VM_OPERATIONS.START } })

    expect(isVmOperationPending(vm, VM_OPERATIONS.START)).toBe(true)
  })

  it('matches when given an array of operations', () => {
    const vm = createVm({ current_operations: { 'task-1': VM_OPERATIONS.SNAPSHOT } })

    expect(isVmOperationPending(vm, [VM_OPERATIONS.START, VM_OPERATIONS.SNAPSHOT])).toBe(true)
  })

  it('returns false when none of the current operations match', () => {
    const vm = createVm({ current_operations: { 'task-1': VM_OPERATIONS.CLONE } })

    expect(isVmOperationPending(vm, [VM_OPERATIONS.START, VM_OPERATIONS.SNAPSHOT])).toBe(false)
  })

  it('returns false when there are no current operations', () => {
    const vm = createVm({ current_operations: {} })

    expect(isVmOperationPending(vm, VM_OPERATIONS.START)).toBe(false)
  })
})

describe('areVmsOperationPending', () => {
  it('returns true when at least one VM has a pending operation', () => {
    const idleVm = createVm({ current_operations: {} })
    const snapshottingVm = createVm({ current_operations: { 'task-1': VM_OPERATIONS.SNAPSHOT } })

    expect(areVmsOperationPending([idleVm, snapshottingVm], VM_OPERATIONS.SNAPSHOT)).toBe(true)
  })

  it('returns false when no VM has a pending operation', () => {
    const idleVm = createVm({ current_operations: {} })
    const otherVm = createVm({ current_operations: { 'task-1': VM_OPERATIONS.CLONE } })

    expect(areVmsOperationPending([idleVm, otherVm], VM_OPERATIONS.SNAPSHOT)).toBe(false)
  })
})

describe('getVmsPendingOperation', () => {
  it('returns the first requested operation found among the VMs', () => {
    const idleVm = createVm({ current_operations: {} })
    const snapshottingVm = createVm({ current_operations: { 'task-1': VM_OPERATIONS.SNAPSHOT } })

    expect(getVmsPendingOperation([idleVm, snapshottingVm], [VM_OPERATIONS.START, VM_OPERATIONS.SNAPSHOT])).toBe(
      VM_OPERATIONS.SNAPSHOT
    )
  })

  it('follows the requested order when a VM has several pending operations', () => {
    const busyVm = createVm({ current_operations: { 'task-1': VM_OPERATIONS.SNAPSHOT, 'task-2': VM_OPERATIONS.CLONE } })

    expect(getVmsPendingOperation([busyVm], [VM_OPERATIONS.CLONE, VM_OPERATIONS.SNAPSHOT])).toBe(VM_OPERATIONS.CLONE)
  })

  it('stops at the first VM having a pending operation', () => {
    const cloningVm = createVm({ current_operations: { 'task-1': VM_OPERATIONS.CLONE } })
    const snapshottingVm = createVm({ current_operations: { 'task-2': VM_OPERATIONS.SNAPSHOT } })

    expect(getVmsPendingOperation([cloningVm, snapshottingVm], [VM_OPERATIONS.SNAPSHOT, VM_OPERATIONS.CLONE])).toBe(
      VM_OPERATIONS.CLONE
    )
  })

  it('returns undefined when no VM has any of the requested operations pending', () => {
    const idleVm = createVm({ current_operations: {} })

    expect(getVmsPendingOperation([idleVm], VM_OPERATIONS.SNAPSHOT)).toBeUndefined()
  })
})

describe('areAllVmsHavingPowerState', () => {
  it('returns true when every VM matches one of the power states', () => {
    const runningVm = createVm({ power_state: VM_POWER_STATE.RUNNING })
    const pausedVm = createVm({ power_state: VM_POWER_STATE.PAUSED })

    expect(areAllVmsHavingPowerState([runningVm, pausedVm], [VM_POWER_STATE.RUNNING, VM_POWER_STATE.PAUSED])).toBe(true)
  })

  it('returns false when at least one VM does not match', () => {
    const runningVm = createVm({ power_state: VM_POWER_STATE.RUNNING })
    const haltedVm = createVm({ power_state: VM_POWER_STATE.HALTED })

    expect(areAllVmsHavingPowerState([runningVm, haltedVm], [VM_POWER_STATE.RUNNING])).toBe(false)
  })
})

describe('notAllVmsHavingPowerState', () => {
  it('returns false when every VM matches one of the power states', () => {
    const runningVm = createVm({ power_state: VM_POWER_STATE.RUNNING })

    expect(notAllVmsHavingPowerState([runningVm], [VM_POWER_STATE.RUNNING])).toBe(false)
  })

  it('returns true when at least one VM does not match', () => {
    const runningVm = createVm({ power_state: VM_POWER_STATE.RUNNING })
    const haltedVm = createVm({ power_state: VM_POWER_STATE.HALTED })

    expect(notAllVmsHavingPowerState([runningVm, haltedVm], [VM_POWER_STATE.RUNNING])).toBe(true)
  })
})

describe('getVmIpAddresses', () => {
  it('returns the addresses sorted alphabetically', () => {
    const vm = createVm({ addresses: { '0/ipv4/0': '10.0.0.2', '0/ipv4/1': '10.0.0.1' } })

    expect(getVmIpAddresses(vm)).toEqual(['10.0.0.1', '10.0.0.2'])
  })

  it('returns an empty array when the VM has no addresses', () => {
    const vm = createVm({ addresses: undefined })

    expect(getVmIpAddresses(vm)).toEqual([])
  })
})

describe('extractVmHostId', () => {
  it('returns the container id when the VM runs on a host', () => {
    const vm = createVm({
      $container: 'host-1' as FrontXoVm['$container'],
      $pool: 'pool-1' as FrontXoVm['$pool'],
    })

    expect(extractVmHostId(vm)).toBe('host-1')
  })

  it('returns undefined when the container is the pool', () => {
    const vm = createVm({
      $container: 'pool-789' as FrontXoVm['$container'],
      $pool: 'pool-789' as FrontXoVm['$pool'],
    })

    expect(extractVmHostId(vm)).toBeUndefined()
  })
})
