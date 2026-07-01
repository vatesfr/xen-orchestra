import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import { createVm } from '@/test/create-vm.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { VM_OPERATIONS, VM_POWER_STATE } from '@vates/types'
import { expect, test } from 'vitest'
import { ref } from 'vue'

test('powerState maps the VM power state to an icon and a translated label', () => {
  const { result } = mountComposable(() => useXoVmUtils(createVm({ power_state: VM_POWER_STATE.RUNNING })))

  expect(result.powerState.value.icon).toBe('status:running-circle')
  expect(result.powerState.value.text).toBe('Running')
})

test('powerState reacts to changes of the source VM', () => {
  const vm = ref(createVm({ power_state: VM_POWER_STATE.RUNNING }))
  const { result } = mountComposable(() => useXoVmUtils(vm))

  expect(result.powerState.value.icon).toBe('status:running-circle')

  vm.value = createVm({ power_state: VM_POWER_STATE.HALTED })

  expect(result.powerState.value.icon).toBe('status:halted-circle')
  expect(result.powerState.value.text).toBe('Halted')
})

test('relativeStartTime returns "Not running" when the VM is halted', () => {
  const { result } = mountComposable(() => useXoVmUtils(createVm({ power_state: VM_POWER_STATE.HALTED })))

  expect(result.relativeStartTime.value).toBe('Not running')
})

test('installDateFormatted returns "Unknown" when there is no install time', () => {
  const { result } = mountComposable(() => useXoVmUtils(createVm({ installTime: undefined })))

  expect(result.installDateFormatted.value).toBe('Unknown')
})

test('hasGuestTools requires both management agent and PV drivers to be detected', () => {
  const { result } = mountComposable(() => useXoVmUtils(createVm()))

  expect(result.hasGuestTools(createVm({ managementAgentDetected: true, pvDriversDetected: true }))).toBe(true)
  expect(result.hasGuestTools(createVm({ managementAgentDetected: false, pvDriversDetected: true }))).toBe(false)
  expect(result.hasGuestTools(createVm({ managementAgentDetected: true, pvDriversDetected: false }))).toBe(false)
})

test('guestToolsDisplay shows a placeholder when the VM is not running', () => {
  const { result } = mountComposable(() => useXoVmUtils(createVm({ power_state: VM_POWER_STATE.HALTED })))

  expect(result.guestToolsDisplay.value).toEqual({ type: 'text', value: '-' })
})

test('guestToolsDisplay shows the PV drivers version when guest tools are installed', () => {
  const { result } = mountComposable(() =>
    useXoVmUtils(
      createVm({
        power_state: VM_POWER_STATE.RUNNING,
        managementAgentDetected: true,
        pvDriversDetected: true,
        pvDriversVersion: '7.5.0',
      })
    )
  )

  expect(result.guestToolsDisplay.value).toMatchObject({ type: 'text', value: '7.5.0' })
})

test('guestToolsDisplay offers to install guest tools when they are missing', () => {
  const { result } = mountComposable(() =>
    useXoVmUtils(
      createVm({
        power_state: VM_POWER_STATE.RUNNING,
        managementAgentDetected: false,
        pvDriversDetected: false,
      })
    )
  )

  expect(result.guestToolsDisplay.value.type).toBe('link')
  expect(result.guestToolsDisplay.value.value).toBe('Install guest tools')
})

test('isChangingState is true while a state-changing operation is pending', () => {
  const idle = mountComposable(() => useXoVmUtils(createVm({ current_operations: {} })))
  expect(idle.result.isChangingState.value).toBe(false)

  const rebooting = mountComposable(() =>
    useXoVmUtils(createVm({ current_operations: { task1: VM_OPERATIONS.CLEAN_REBOOT } }))
  )
  expect(rebooting.result.isChangingState.value).toBe(true)
})

test('currentOperation maps the pending operation to a translated label', () => {
  const { result } = mountComposable(() =>
    useXoVmUtils(createVm({ current_operations: { task1: VM_OPERATIONS.SNAPSHOT } }))
  )

  expect(result.currentOperation.value).toBe('Snapshotting')
})
