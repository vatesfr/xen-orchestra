import { useVmMigrate } from '@/modules/vm/composables/use-vm-migrate.composable.ts'
import type { VmMigratePayload } from '@/modules/vm/form/migrate/use-vm-migrate-form.ts'
import { useXoVmMigrateJob } from '@/modules/vm/jobs/xo-vm-migrate.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createJobResult } from '@/test/create-job-result.ts'
import { createVm } from '@/test/create-vm.ts'
import { overlayMock, mockOverlay } from '@/test/mock-overlay.ts'
import { mockXoRoutes } from '@/test/mock-xo-routes.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockModule, mockedExport } from '@/test/spy-on-module.ts'
import type { useBlockedModal } from '@core/composables/modals/use-blocked-modal.ts'
import { flushPromises } from '@vue/test-utils'
import type { Ref } from 'vue'

type OverlayEvents = Record<string, ((...args: unknown[]) => unknown) | true>

const useXoVmMigrateJobMock = mockedExport(useXoVmMigrateJob)

const runMock = vi.fn()
const openBlockedModalMock = vi.fn()

mockOverlay()

mockModule(import('@core/composables/modals/use-blocked-modal.ts'), () => ({
  useBlockedModal: (() => ({ open: openBlockedModalMock })) as unknown as typeof useBlockedModal,
}))

mockXoRoutes()

const payload: VmMigratePayload = { hostId: 'host-target' as VmMigratePayload['hostId'] }

// Each `run()` records the payload the job was given at that moment
let runPayloads: (VmMigratePayload | undefined)[]

// The overlay the composable defines itself: the migrate drawer (`onConfirm`)
function getOverlay(eventName: string) {
  const overlay = overlayMock.getOverlays<{ events: OverlayEvents }>().find(overlay => eventName in overlay.events)

  if (overlay === undefined) {
    throw new Error(`No overlay handles "${eventName}"`)
  }

  return overlay
}

beforeEach(() => {
  runMock.mockReset()
  overlayMock.reset()
  openBlockedModalMock.mockReset()

  runPayloads = []

  useXoVmMigrateJobMock.mockImplementation((_vm: unknown, payloadRef: Ref<VmMigratePayload | undefined>) => {
    runMock.mockImplementation(() => {
      runPayloads.push(payloadRef.value)
    })

    return createJobResult(runMock)
  })
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
      props: { blockedOperation: 'migrate_send', href: `https://xo5.example.com/#/vms/${vm.id}/advanced` },
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
