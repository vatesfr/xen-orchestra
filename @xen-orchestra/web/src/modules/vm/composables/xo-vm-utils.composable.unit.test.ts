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
  return mountComposable(() => useXoVmUtils(createVm(overrides))).result
}

describe('powerState', () => {
  test('maps the VM power state to an icon and a translated label', () => {
    const result = mountVmUtils({ power_state: VM_POWER_STATE.RUNNING })

    expect(result.powerState.value.icon).toBe('status:running-circle')
    expect(result.powerState.value.text).toBe('Running')
  })

  test('reacts to changes of the source VM', () => {
    const vm = ref(createVm({ power_state: VM_POWER_STATE.RUNNING }))
    const { result } = mountComposable(() => useXoVmUtils(vm))

    expect(result.powerState.value.icon).toBe('status:running-circle')

    vm.value = createVm({ power_state: VM_POWER_STATE.HALTED })

    expect(result.powerState.value.icon).toBe('status:halted-circle')
    expect(result.powerState.value.text).toBe('Halted')
  })
})

describe('relativeStartTime', () => {
  test('returns "Not running" when the VM is halted', () => {
    const result = mountVmUtils({ power_state: VM_POWER_STATE.HALTED })

    expect(result.relativeStartTime.value).toBe('Not running')
  })

  test('returns a relative time when the VM is running with a start time', () => {
    const result = mountVmUtils({ power_state: VM_POWER_STATE.RUNNING, startTime: 1660000000 })

    expect(result.relativeStartTime.value).not.toBe('Not running')
    expect(result.relativeStartTime.value).not.toBe('')
  })
})

describe('installDateFormatted', () => {
  test('returns "Unknown" when there is no install time', () => {
    const result = mountVmUtils({ installTime: undefined })

    expect(result.installDateFormatted.value).toBe('Unknown')
  })

  test('formats the install date with the current locale', () => {
    const installTime = 1660000000
    const { result } = mountComposable(() => {
      const { locale } = useI18n()
      const utils = useXoVmUtils(createVm({ installTime }))
      const expected = new Intl.DateTimeFormat(locale.value, { dateStyle: 'long' }).format(
        new Date(parseDateTime(installTime * 1000))
      )

      return { utils, expected }
    })

    expect(result.utils.installDateFormatted.value).toBe(result.expected)
    expect(result.utils.installDateFormatted.value).not.toBe('Unknown')
  })
})

describe('hasGuestTools', () => {
  test('requires both management agent and PV drivers to be detected', () => {
    const result = mountVmUtils()

    expect(result.hasGuestTools(createVm({ managementAgentDetected: true, pvDriversDetected: true }))).toBe(true)
    expect(result.hasGuestTools(createVm({ managementAgentDetected: false, pvDriversDetected: true }))).toBe(false)
    expect(result.hasGuestTools(createVm({ managementAgentDetected: true, pvDriversDetected: false }))).toBe(false)
  })
})

describe('guestToolsDisplay', () => {
  test('shows a placeholder when the VM is not running', () => {
    const result = mountVmUtils({ power_state: VM_POWER_STATE.HALTED })

    expect(result.guestToolsDisplay.value).toEqual({ type: 'text', value: '-' })
  })

  test('shows the PV drivers version when guest tools are installed', () => {
    const result = mountVmUtils({
      power_state: VM_POWER_STATE.RUNNING,
      managementAgentDetected: true,
      pvDriversDetected: true,
      pvDriversVersion: '7.5.0',
    })

    expect(result.guestToolsDisplay.value).toMatchObject({ type: 'text', value: '7.5.0' })
  })

  test('falls back to the "installed" label when the PV drivers version is unknown', () => {
    const result = mountVmUtils({
      power_state: VM_POWER_STATE.RUNNING,
      managementAgentDetected: true,
      pvDriversDetected: true,
      pvDriversVersion: '',
    })

    expect(result.guestToolsDisplay.value.type).toBe('text')
    expect(result.guestToolsDisplay.value.value).not.toBe('-')
    expect(result.guestToolsDisplay.value.value).not.toBe('7.5.0')
  })

  test('offers to install guest tools when they are missing', () => {
    const result = mountVmUtils({
      power_state: VM_POWER_STATE.RUNNING,
      managementAgentDetected: false,
      pvDriversDetected: false,
    })

    expect(result.guestToolsDisplay.value.type).toBe('link')
    expect(result.guestToolsDisplay.value.value).toBe('Install guest tools')
  })
})

describe('isChangingState', () => {
  test('is false when no state-changing operation is pending', () => {
    const result = mountVmUtils({ current_operations: {} })

    expect(result.isChangingState.value).toBe(false)
  })

  test('is true while a state-changing operation is pending', () => {
    const result = mountVmUtils({ current_operations: { task1: VM_OPERATIONS.CLEAN_REBOOT } })

    expect(result.isChangingState.value).toBe(true)
  })
})

describe('currentOperation', () => {
  test('maps the pending operation to a translated label', () => {
    const result = mountVmUtils({ current_operations: { task1: VM_OPERATIONS.SNAPSHOT } })

    expect(result.currentOperation.value).toBe('Snapshotting')
  })

  test('falls back to an empty label for an unknown operation', () => {
    const result = mountVmUtils({ current_operations: { task1: 'some_unknown_op' as VM_OPERATIONS } })

    expect(result.currentOperation.value).toBe('')
  })

  test('falls back to an empty label when there is no pending operation', () => {
    const result = mountVmUtils({ current_operations: {} })

    expect(result.currentOperation.value).toBe('')
  })
})

describe('xo5VmAdvancedHref', () => {
  test('builds the XO5 advanced route for the VM id', () => {
    buildXo5Route.mockImplementation((path: string) => `https://xo5.example.com/#${path}`)

    const result = mountVmUtils({ id: 'vm-42' as FrontXoVm['id'] })

    expect(result.xo5VmAdvancedHref.value).toBe('https://xo5.example.com/#/vms/vm-42/advanced')
  })
})
