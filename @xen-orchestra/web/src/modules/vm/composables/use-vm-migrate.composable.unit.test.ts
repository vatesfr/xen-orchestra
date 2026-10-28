import { useVmMigrate } from '@/modules/vm/composables/use-vm-migrate.composable.ts'
import type { VmMigratePayload } from '@/modules/vm/form/migrate/use-vm-migrate-form.ts'
import type { useXoVmMigrateJob } from '@/modules/vm/jobs/xo-vm-migrate.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { createVm } from '@/test/create-vm.ts'
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

const payload: VmMigratePayload = { hostId: 'host-target' as VmMigratePayload['hostId'] }

// Each `run()` records the payload the job was given at that moment
let runPayloads: (VmMigratePayload | undefined)[]

// The overlay the composable defines itself: the migrate drawer (`onConfirm`)
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
  overlays = []

  useXoVmMigrateJobMock.mockImplementation((_vm: unknown, payloadRef: Ref<VmMigratePayload | undefined>) => {
    runMock.mockImplementation(() => {
      runPayloads.push(payloadRef.value)
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

  it('runs the migration detached with the payload confirmed in the drawer', async () => {
    const { result } = mountVmMigrate()

    result.migrateVm()
    await confirmDrawer()

    expect(runPayloads).toEqual([payload])
    expect(runMock).toHaveBeenCalledWith({ detached: true })
  })
})
