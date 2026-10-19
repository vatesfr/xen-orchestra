import { useVmMigrate } from '@/modules/vm/composables/use-vm-migrate.composable.ts'
import type { VmMigratePayload } from '@/modules/vm/form/migrate/use-vm-migrate-form.ts'
import type { useXoVmMigrateJob } from '@/modules/vm/jobs/xo-vm-migrate.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { MonitoredTaskError } from '@/shared/composables/xo-task-utils.composable.ts'
import type { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { createVm } from '@/test/create-vm.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { useBlockedModal } from '@core/composables/modals/use-blocked-modal.ts'
import type { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { flushPromises } from '@vue/test-utils'
import { computed, type Ref } from 'vue'

type OverlayEvents = Record<string, ((...args: unknown[]) => unknown) | true>

type OverlayStub = { events: OverlayEvents; open: ReturnType<typeof vi.fn> }

const { useXoVmMigrateJobMock, runMock, useOverlayMock, openBlockedModalMock, buildXo5Route } = vi.hoisted(() => ({
  useXoVmMigrateJobMock: vi.fn(),
  runMock: vi.fn(),
  useOverlayMock: vi.fn(),
  openBlockedModalMock: vi.fn(),
  buildXo5Route: vi.fn(),
}))

vi.mock(import('@/modules/vm/jobs/xo-vm-migrate.job.ts'), () => ({
  useXoVmMigrateJob: useXoVmMigrateJobMock as unknown as typeof useXoVmMigrateJob,
}))

vi.mock(import('@core/packages/overlay/use-overlay.ts'), () => ({
  useOverlay: useOverlayMock as unknown as typeof useOverlay,
}))

vi.mock(import('@core/composables/modals/use-blocked-modal.ts'), () => ({
  useBlockedModal: (() => ({ open: openBlockedModalMock })) as unknown as typeof useBlockedModal,
}))

vi.mock(import('@/shared/remote-resources/use-xo-routes.ts'), () => ({
  useXoRoutes: (() => ({ buildXo5Route })) as unknown as typeof useXoRoutes,
}))

const TASK_ID = 'task-1' as MonitoredTaskError['taskId']

const payload: VmMigratePayload = { hostId: 'host-target' as VmMigratePayload['hostId'] }

function createTaskError(message: string): MonitoredTaskError {
  return Object.assign(new Error(message), { taskId: TASK_ID })
}

// Each `run()` records the payload the job was given at that moment, and fails with the next queued error, if any
let runPayloads: (VmMigratePayload | undefined)[]
let runFailures: unknown[]

// The two overlays the composable defines itself: the migrate drawer (`onConfirm`) and the error modal (`onClose`)
let overlays: OverlayStub[]

function getOverlay(eventName: string): OverlayStub {
  const overlay = overlays.find(overlay => eventName in overlay.events)

  if (overlay === undefined) {
    throw new Error(`No overlay handles "${eventName}"`)
  }

  return overlay
}

beforeEach(() => {
  useXoVmMigrateJobMock.mockReset()
  runMock.mockReset()
  useOverlayMock.mockReset()
  openBlockedModalMock.mockReset()
  buildXo5Route.mockReset()

  runPayloads = []
  runFailures = []
  overlays = []

  useXoVmMigrateJobMock.mockImplementation((_vm: unknown, payloadRef: Ref<VmMigratePayload | undefined>) => {
    runMock.mockImplementation(async () => {
      runPayloads.push(payloadRef.value)

      const failure = runFailures.shift()

      if (failure !== undefined) {
        throw failure
      }
    })

    return {
      run: runMock,
      canRun: computed(() => true),
      isRunning: computed(() => false),
      errorMessage: computed(() => undefined),
    }
  })

  useOverlayMock.mockImplementation(({ events }: { events: OverlayEvents }) => {
    const overlay: OverlayStub = { events, open: vi.fn() }

    overlays.push(overlay)

    return { open: overlay.open, abort: vi.fn() }
  })

  buildXo5Route.mockImplementation((path: string) => `xo5:${path}`)

  vi.spyOn(console, 'error').mockImplementation(() => {})
})

function mountVmMigrate(vm: FrontXoVm = createVm({ name_label: 'web-server' })) {
  const { wrapper } = mountComposable(() => useVmMigrate(vm))

  return { vm, result: wrapper.vm }
}

async function confirmDrawer(migratePayload: VmMigratePayload = payload) {
  const { events } = getOverlay('onConfirm')

  if (events.onConfirm === true) {
    throw new Error('The drawer confirmation is not handled')
  }

  events.onConfirm(migratePayload)
  await flushPromises()
}

describe('migrateVm', () => {
  it('opens the migrate drawer with the VM', () => {
    const { vm, result } = mountVmMigrate()

    result.migrateVm()

    expect(getOverlay('onConfirm').open).toHaveBeenCalledWith({ props: { vm } })
    expect(openBlockedModalMock).not.toHaveBeenCalled()
  })

  it('opens the blocked modal instead of the drawer when the VM is protected against migration', () => {
    const { vm, result } = mountVmMigrate(
      createVm({ blockedOperations: { migrate_send: 'true' } as FrontXoVm['blockedOperations'] })
    )

    result.migrateVm()

    expect(result.isMigrationBlocked).toBe(true)
    expect(openBlockedModalMock).toHaveBeenCalledWith({
      props: { blockedOperation: 'migrate_send', href: `xo5:/vms/${vm.id}/advanced` },
    })
    expect(getOverlay('onConfirm').open).not.toHaveBeenCalled()
  })

  it('runs the migration with the payload confirmed in the drawer', async () => {
    const { result } = mountVmMigrate()

    result.migrateVm()
    await confirmDrawer()

    expect(runPayloads).toEqual([payload])
    expect(getOverlay('onClose').open).not.toHaveBeenCalled()
  })

  it('shows the error with a link to the task when the task fails', async () => {
    const error = createTaskError('VM_INCOMPATIBLE_WITH_THIS_HOST(OpaqueRef:host, OpaqueRef:vm)')
    runFailures.push(error)

    const { vm, result } = mountVmMigrate()

    result.migrateVm()
    await confirmDrawer()

    expect(getOverlay('onClose').open).toHaveBeenCalledWith({
      props: {
        title: t('unable-to-migrate-vm', { name: vm.name_label }),
        error: error.message,
        vmId: vm.id,
        taskId: TASK_ID,
      },
    })
  })

  it('shows the error without a task when the request itself failed', async () => {
    runFailures.push(new Error('Bad Request'))

    const { vm, result } = mountVmMigrate()

    result.migrateVm()
    await confirmDrawer()

    expect(getOverlay('onClose').open).toHaveBeenCalledWith({
      props: {
        title: t('unable-to-migrate-vm', { name: vm.name_label }),
        error: 'Bad Request',
        vmId: vm.id,
        taskId: undefined,
      },
    })
  })
})
