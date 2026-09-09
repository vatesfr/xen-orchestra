import { useXoHostUtils } from '@/modules/host/composables/xo-host-utils.composable.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createVm } from '@/test/create-vm.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { getRelativeTime } from '@core/composables/relative-time.composable.ts'
import { HOST_ALLOWED_OPERATIONS, HOST_POWER_STATE, VM_OPERATIONS } from '@vates/types'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vmsByHost } = vi.hoisted(() => ({
  vmsByHost: { value: new Map<string, unknown[]>() },
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({ vmsByHost })) as unknown as typeof useXoVmCollection,
}))

beforeEach(() => {
  vmsByHost.value = new Map()
})

function setResidentVms(hostId: FrontXoHost['id'], vms: FrontXoVm[]) {
  vmsByHost.value = new Map([[hostId, vms]])
}

function mountHostUtils(overrides: Partial<FrontXoHost> = {}) {
  return mountComposable(() => {
    const { t } = useI18n()

    return { ...useXoHostUtils(createHost(overrides)), t }
  }).wrapper.vm
}

describe('getPowerState', () => {
  it('maps the running state to its label and running-circle icon', () => {
    const { getPowerState, t } = mountHostUtils()

    expect(getPowerState(HOST_POWER_STATE.RUNNING)).toEqual({
      text: t('host:status:running'),
      icon: 'status:running-circle',
    })
  })

  it('maps the halted state to its label and halted-circle icon', () => {
    const { getPowerState, t } = mountHostUtils()

    expect(getPowerState(HOST_POWER_STATE.HALTED)).toEqual({
      text: t('host:status:halted'),
      icon: 'status:halted-circle',
    })
  })

  it('maps the unknown state to its label and no icon', () => {
    const { getPowerState, t } = mountHostUtils()

    expect(getPowerState(HOST_POWER_STATE.UNKNOWN)).toEqual({ text: t('host:status:unknown'), icon: undefined })
  })

  it('falls back to the unknown entry for an out-of-range value', () => {
    const { getPowerState, t } = mountHostUtils()

    const outOfRangeState = 'Suspended' as HOST_POWER_STATE

    expect(getPowerState(outOfRangeState)).toEqual({ text: t('host:status:unknown'), icon: undefined })
  })
})

describe('getRelativeStartTime', () => {
  it('reports the start time relative to now, reading it as seconds', () => {
    const startTimeInSeconds = 1660000000

    const { wrapper } = mountComposable(() => {
      const { locale } = useI18n()

      return {
        relativeStartTime: useXoHostUtils(createHost()).getRelativeStartTime(startTimeInSeconds),
        expectedRelativeTime: getRelativeTime(new Date(startTimeInSeconds * 1000), locale.value),
      }
    })

    expect(wrapper.vm.relativeStartTime).toBe(wrapper.vm.expectedRelativeTime)
  })
})

describe('isChangingState', () => {
  it('is false when no operation is pending', () => {
    const { isChangingState } = mountHostUtils({ current_operations: {} })

    expect(isChangingState).toBe(false)
  })

  it('is true while a state-changing operation is pending on a running host', () => {
    const { isChangingState } = mountHostUtils({
      power_state: HOST_POWER_STATE.RUNNING,
      current_operations: { 'task-1': HOST_ALLOWED_OPERATIONS.SHUTDOWN },
    })

    expect(isChangingState).toBe(true)
  })

  it('is false when the pending operation does not change the state of a running host', () => {
    const { isChangingState } = mountHostUtils({
      power_state: HOST_POWER_STATE.RUNNING,
      current_operations: { 'task-1': HOST_ALLOWED_OPERATIONS.POWER_ON },
    })

    expect(isChangingState).toBe(false)
  })

  it('is true while a halted host is powering on', () => {
    const { isChangingState } = mountHostUtils({
      power_state: HOST_POWER_STATE.HALTED,
      current_operations: { 'task-1': HOST_ALLOWED_OPERATIONS.POWER_ON },
    })

    expect(isChangingState).toBe(true)
  })

  it('is true while a resident VM of a disabled host is suspending', () => {
    const host = createHost({ enabled: false, current_operations: {} })

    setResidentVms(host.id, [createVm({ current_operations: { 'task-1': VM_OPERATIONS.SUSPEND } })])

    const { wrapper } = mountComposable(() => useXoHostUtils(host))

    expect(wrapper.vm.isChangingState).toBe(true)
  })

  it('is false when a resident VM is suspending but the host is still enabled', () => {
    const host = createHost({ enabled: true, current_operations: {} })

    setResidentVms(host.id, [createVm({ current_operations: { 'task-1': VM_OPERATIONS.SUSPEND } })])

    const { wrapper } = mountComposable(() => useXoHostUtils(host))

    expect(wrapper.vm.isChangingState).toBe(false)
  })

  it('reacts to changes of the source host', () => {
    const host = ref(createHost({ current_operations: {} }))
    const { wrapper } = mountComposable(() => useXoHostUtils(host))

    expect(wrapper.vm.isChangingState).toBe(false)

    host.value = createHost({ current_operations: { 'task-1': HOST_ALLOWED_OPERATIONS.REBOOT } })

    expect(wrapper.vm.isChangingState).toBe(true)
  })
})

describe('currentOperation', () => {
  it('maps the pending host operation to a translated label', () => {
    const { currentOperation, t } = mountHostUtils({
      current_operations: { 'task-1': HOST_ALLOWED_OPERATIONS.REBOOT },
    })

    expect(currentOperation).toBe(t('operation:clean-reboot'))
  })

  it('maps the power-on operation of a halted host to a translated label', () => {
    const { currentOperation, t } = mountHostUtils({
      power_state: HOST_POWER_STATE.HALTED,
      current_operations: { 'task-1': HOST_ALLOWED_OPERATIONS.POWER_ON },
    })

    expect(currentOperation).toBe(t('operation:start'))
  })

  it('maps the smart-reboot VM operation to a translated label', () => {
    const host = createHost({ enabled: false, current_operations: {} })

    setResidentVms(host.id, [createVm({ current_operations: { 'task-1': VM_OPERATIONS.HARD_SHUTDOWN } })])

    const { wrapper } = mountComposable(() => {
      const { t } = useI18n()

      return { ...useXoHostUtils(host), t }
    })

    expect(wrapper.vm.currentOperation).toBe(wrapper.vm.t('operation:vm-hard-shutdown'))
  })

  it('falls back to an empty label when there is no pending operation', () => {
    const { currentOperation } = mountHostUtils({ current_operations: {} })

    expect(currentOperation).toBe('')
  })

  it('falls back to an empty label for an unmapped operation', () => {
    const { currentOperation } = mountHostUtils({
      current_operations: { 'task-1': 'some_unknown_op' as HOST_ALLOWED_OPERATIONS },
    })

    expect(currentOperation).toBe('')
  })
})
