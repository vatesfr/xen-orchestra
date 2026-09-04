import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { createVm } from '@/test/create-vm.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { parseDateTime } from '@core/utils/time.util.ts'
import { VM_OPERATIONS, VM_POWER_STATE } from '@vates/types'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { buildXo5Route } = vi.hoisted(() => ({
  buildXo5Route: vi.fn(),
}))

vi.mock(import('@/shared/remote-resources/use-xo-routes.ts'), () => ({
  useXoRoutes: (() => ({ buildXo5Route })) as unknown as typeof useXoRoutes,
}))

beforeEach(() => {
  buildXo5Route.mockReset()
})

function mountVmUtils(overrides: Partial<FrontXoVm> = {}) {
  return mountComposable(() => useXoVmUtils(createVm(overrides))).wrapper.vm
}

describe('powerState', () => {
  it('maps the VM power state to an icon and a translated label', () => {
    const result = mountVmUtils({ power_state: VM_POWER_STATE.RUNNING })

    expect(result.powerState.icon).toBe('status:running-circle')
    expect(result.powerState.text).toBe('Running')
  })

  it('reacts to changes of the source VM', () => {
    const vm = ref(createVm({ power_state: VM_POWER_STATE.RUNNING }))
    const { wrapper } = mountComposable(() => useXoVmUtils(vm))

    expect(wrapper.vm.powerState.icon).toBe('status:running-circle')

    vm.value = createVm({ power_state: VM_POWER_STATE.HALTED })

    expect(wrapper.vm.powerState.icon).toBe('status:halted-circle')
    expect(wrapper.vm.powerState.text).toBe('Halted')
  })
})

describe('relativeStartTime', () => {
  it('returns "Not running" when the VM is halted', () => {
    const result = mountVmUtils({ power_state: VM_POWER_STATE.HALTED })

    expect(result.relativeStartTime).toBe('Not running')
  })

  it('returns a relative time when the VM is running with a start time', () => {
    const result = mountVmUtils({ power_state: VM_POWER_STATE.RUNNING, startTime: 1660000000 })

    expect(result.relativeStartTime).not.toBe('Not running')
    expect(result.relativeStartTime).not.toBe('')
  })
})

describe('installDateFormatted', () => {
  it('returns "Unknown" when there is no install time', () => {
    const result = mountVmUtils({ installTime: undefined })

    expect(result.installDateFormatted).toBe('Unknown')
  })

  it('formats the install date with the current locale', () => {
    const installTime = 1660000000
    const { wrapper } = mountComposable(() => {
      const { locale } = useI18n()
      const { installDateFormatted } = useXoVmUtils(createVm({ installTime }))
      const expected = new Intl.DateTimeFormat(locale.value, { dateStyle: 'long' }).format(
        new Date(parseDateTime(installTime * 1000))
      )

      return { installDateFormatted, expected }
    })

    expect(wrapper.vm.installDateFormatted).toBe(wrapper.vm.expected)
    expect(wrapper.vm.installDateFormatted).not.toBe('Unknown')
  })
})

describe('hasGuestTools', () => {
  it('requires both management agent and PV drivers to be detected', () => {
    const result = mountVmUtils()

    expect(result.hasGuestTools(createVm({ managementAgentDetected: true, pvDriversDetected: true }))).toBe(true)
    expect(result.hasGuestTools(createVm({ managementAgentDetected: false, pvDriversDetected: true }))).toBe(false)
    expect(result.hasGuestTools(createVm({ managementAgentDetected: true, pvDriversDetected: false }))).toBe(false)
  })
})

describe('guestToolsDisplay', () => {
  it('is not applicable when the VM is not running', () => {
    const result = mountVmUtils({ power_state: VM_POWER_STATE.HALTED })

    expect(result.guestToolsDisplay).toEqual({ type: 'not-applicable', value: '-' })
  })

  it('offers to install guest tools when the management agent is not detected', () => {
    const result = mountVmUtils({
      power_state: VM_POWER_STATE.RUNNING,
      managementAgentDetected: false,
      pvDriversDetected: false,
    })

    expect(result.guestToolsDisplay).toEqual({
      type: 'missing',
      icon: 'status:halted-circle',
      value: 'Install guest tools',
      tooltip: 'Management agent not detected',
    })
  })

  it('offers to install guest tools when only the PV drivers are not detected', () => {
    const result = mountVmUtils({
      power_state: VM_POWER_STATE.RUNNING,
      managementAgentDetected: true,
      pvDriversDetected: false,
    })

    expect(result.guestToolsDisplay).toMatchObject({ type: 'missing', tooltip: 'No Xen tools detected' })
  })

  it('reports up-to-date guest tools with their version', () => {
    const result = mountVmUtils({
      power_state: VM_POWER_STATE.RUNNING,
      managementAgentDetected: true,
      pvDriversDetected: true,
      pvDriversUpToDate: true,
      pvDriversVersion: '7.5.0',
    })

    expect(result.guestToolsDisplay).toEqual({
      type: 'up-to-date',
      icon: 'status:success-circle',
      value: '7.5.0',
      tooltip: 'Installed',
    })
  })

  it('reports outdated guest tools', () => {
    const result = mountVmUtils({
      power_state: VM_POWER_STATE.RUNNING,
      managementAgentDetected: true,
      pvDriversDetected: true,
      pvDriversUpToDate: false,
      pvDriversVersion: '7.5.0',
    })

    expect(result.guestToolsDisplay).toEqual({
      type: 'outdated',
      icon: 'status:warning-circle',
      value: '7.5.0',
      tooltip: 'Guest tools out of date',
    })
  })

  it('reports an unknown guest tools status when the PV drivers state is not reported', () => {
    const result = mountVmUtils({
      power_state: VM_POWER_STATE.RUNNING,
      managementAgentDetected: true,
      pvDriversDetected: true,
      pvDriversUpToDate: undefined,
      pvDriversVersion: '7.5.0',
    })

    expect(result.guestToolsDisplay).toEqual({
      type: 'unknown',
      icon: 'status:info-circle',
      value: '7.5.0',
      tooltip: 'Guest tools status unknown',
    })
  })

  it('falls back to the "installed" label when the PV drivers version is unknown', () => {
    const result = mountVmUtils({
      power_state: VM_POWER_STATE.RUNNING,
      managementAgentDetected: true,
      pvDriversDetected: true,
      pvDriversUpToDate: true,
      pvDriversVersion: '',
    })

    expect(result.guestToolsDisplay).toMatchObject({ type: 'up-to-date', value: 'Installed' })
  })
})

describe('isChangingState', () => {
  it('is false when no state-changing operation is pending', () => {
    const result = mountVmUtils({ current_operations: {} })

    expect(result.isChangingState).toBe(false)
  })

  it('is true while a state-changing operation is pending', () => {
    const result = mountVmUtils({ current_operations: { task1: VM_OPERATIONS.CLEAN_REBOOT } })

    expect(result.isChangingState).toBe(true)
  })
})

describe('currentOperation', () => {
  it('maps the pending operation to a translated label', () => {
    const result = mountVmUtils({ current_operations: { task1: VM_OPERATIONS.SNAPSHOT } })

    expect(result.currentOperation).toBe('Snapshotting')
  })

  it('falls back to an empty label for an unknown operation', () => {
    const result = mountVmUtils({ current_operations: { task1: 'some_unknown_op' as VM_OPERATIONS } })

    expect(result.currentOperation).toBe('')
  })

  it('falls back to an empty label when there is no pending operation', () => {
    const result = mountVmUtils({ current_operations: {} })

    expect(result.currentOperation).toBe('')
  })
})

describe('xo5VmAdvancedHref', () => {
  it('builds the XO5 advanced route for the VM id', () => {
    buildXo5Route.mockImplementation((path: string) => `https://xo5.example.com/#${path}`)

    const result = mountVmUtils({ id: 'vm-42' as FrontXoVm['id'] })

    expect(result.xo5VmAdvancedHref).toBe('https://xo5.example.com/#/vms/vm-42/advanced')
  })
})
