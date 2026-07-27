import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import {
  areAllVmsHavingPowerState,
  areVmsOperationPending,
  extractVmHostId,
  getVmIpAddresses,
  isVmOperationPending,
  notAllVmsHavingPowerState,
} from '@/modules/vm/utils/xo-vm.util.ts'
import { createVm } from '@/test/create-vm.ts'
import { VM_OPERATIONS, VM_POWER_STATE } from '@vates/types'

describe('isVmOperationPending', () => {
  test('matches a single operation', () => {
    const vm = createVm({ current_operations: { 'task-1': VM_OPERATIONS.START } })

    expect(isVmOperationPending(vm, VM_OPERATIONS.START)).toBe(true)
  })

  test('matches when given an array of operations', () => {
    const vm = createVm({ current_operations: { 'task-1': VM_OPERATIONS.SNAPSHOT } })

    expect(isVmOperationPending(vm, [VM_OPERATIONS.START, VM_OPERATIONS.SNAPSHOT])).toBe(true)
  })

  test('returns false when none of the current operations match', () => {
    const vm = createVm({ current_operations: { 'task-1': VM_OPERATIONS.CLONE } })

    expect(isVmOperationPending(vm, [VM_OPERATIONS.START, VM_OPERATIONS.SNAPSHOT])).toBe(false)
  })

  test('returns false when there are no current operations', () => {
    const vm = createVm({ current_operations: {} })

    expect(isVmOperationPending(vm, VM_OPERATIONS.START)).toBe(false)
  })
})

describe('areVmsOperationPending', () => {
  test('returns true when at least one VM has a pending operation', () => {
    const idleVm = createVm({ current_operations: {} })
    const snapshottingVm = createVm({ current_operations: { 'task-1': VM_OPERATIONS.SNAPSHOT } })

    expect(areVmsOperationPending([idleVm, snapshottingVm], VM_OPERATIONS.SNAPSHOT)).toBe(true)
  })

  test('returns false when no VM has a pending operation', () => {
    const idleVm = createVm({ current_operations: {} })
    const otherVm = createVm({ current_operations: { 'task-1': VM_OPERATIONS.CLONE } })

    expect(areVmsOperationPending([idleVm, otherVm], VM_OPERATIONS.SNAPSHOT)).toBe(false)
  })
})

describe('areAllVmsHavingPowerState', () => {
  test('returns true when every VM matches one of the power states', () => {
    const runningVm = createVm({ power_state: VM_POWER_STATE.RUNNING })
    const pausedVm = createVm({ power_state: VM_POWER_STATE.PAUSED })

    expect(areAllVmsHavingPowerState([runningVm, pausedVm], [VM_POWER_STATE.RUNNING, VM_POWER_STATE.PAUSED])).toBe(true)
  })

  test('returns false when at least one VM does not match', () => {
    const runningVm = createVm({ power_state: VM_POWER_STATE.RUNNING })
    const haltedVm = createVm({ power_state: VM_POWER_STATE.HALTED })

    expect(areAllVmsHavingPowerState([runningVm, haltedVm], [VM_POWER_STATE.RUNNING])).toBe(false)
  })
})

describe('notAllVmsHavingPowerState', () => {
  test('returns false when every VM matches one of the power states', () => {
    const runningVm = createVm({ power_state: VM_POWER_STATE.RUNNING })

    expect(notAllVmsHavingPowerState([runningVm], [VM_POWER_STATE.RUNNING])).toBe(false)
  })

  test('returns true when at least one VM does not match', () => {
    const runningVm = createVm({ power_state: VM_POWER_STATE.RUNNING })
    const haltedVm = createVm({ power_state: VM_POWER_STATE.HALTED })

    expect(notAllVmsHavingPowerState([runningVm, haltedVm], [VM_POWER_STATE.RUNNING])).toBe(true)
  })
})

describe('getVmIpAddresses', () => {
  test('returns the addresses sorted alphabetically', () => {
    const vm = createVm({ addresses: { '0/ipv4/0': '10.0.0.2', '0/ipv4/1': '10.0.0.1' } })

    expect(getVmIpAddresses(vm)).toEqual(['10.0.0.1', '10.0.0.2'])
  })

  test('returns an empty array when the VM has no addresses', () => {
    const vm = createVm({ addresses: undefined })

    expect(getVmIpAddresses(vm)).toEqual([])
  })
})

describe('extractVmHostId', () => {
  test('returns the container id when the VM runs on a host', () => {
    const vm = createVm({
      $container: 'host-1' as FrontXoVm['$container'],
      $pool: 'pool-1' as FrontXoVm['$pool'],
    })

    expect(extractVmHostId(vm)).toBe('host-1')
  })

  test('returns undefined when the container is the pool', () => {
    const vm = createVm({
      $container: 'pool-789' as FrontXoVm['$container'],
      $pool: 'pool-789' as FrontXoVm['$pool'],
    })

    expect(extractVmHostId(vm)).toBeUndefined()
  })
})
