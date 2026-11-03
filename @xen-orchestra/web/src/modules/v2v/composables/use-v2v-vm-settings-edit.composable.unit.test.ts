import type { V2vVmOverrides } from '@/modules/v2v/composables/use-v2v-vm-mapping.composable.ts'
import { useV2vVmSettingsEdit } from '@/modules/v2v/composables/use-v2v-vm-settings-edit.composable.ts'
import { mountV2vVmMapping, readV2vStoredListVm } from '@/test/mount-v2v-vm-mapping.ts'
import { V2V_DEBIAN_TEMPLATE, V2V_DISK_OVERRIDES, V2V_MAPPED_VM } from '@/test/v2v-mapping-fixtures.ts'
import type { useOverlay } from '@core/packages/overlay/use-overlay.ts'

type OverlayOptions = {
  events: {
    onConfirm: (overrides: V2vVmOverrides) => unknown
    onCancel: true
  }
}

const { useOverlayMock, open } = vi.hoisted(() => ({
  useOverlayMock: vi.fn(),
  open: vi.fn(),
}))

vi.mock(import('@core/packages/overlay/use-overlay.ts'), () => ({
  useOverlay: useOverlayMock as unknown as typeof useOverlay,
}))

beforeEach(() => {
  useOverlayMock.mockReset()
  open.mockReset()

  useOverlayMock.mockReturnValue({ open, abort: vi.fn() })
})

function mountVmSettingsEdit() {
  const updateVm = vi.fn()

  const result = mountV2vVmMapping((migrationList, list) => {
    updateVm.mockImplementation(migrationList.updateVm)

    return { ...useV2vVmSettingsEdit(V2V_MAPPED_VM, { list, updateVm }), list: list() }
  })

  return { result, updateVm }
}

function getOverlayOptions(): OverlayOptions {
  return useOverlayMock.mock.calls[0][0]
}

describe('editVmSettings', () => {
  it('opens the drawer with the VM and its list', () => {
    const { result } = mountVmSettingsEdit()

    result.editVmSettings()

    expect(open).toHaveBeenCalledWith({ props: { vm: V2V_MAPPED_VM, list: result.list } })
  })

  it('closes the drawer when it is cancelled', () => {
    mountVmSettingsEdit()

    expect(getOverlayOptions().events.onCancel).toBe(true)
  })
})

describe('onConfirm', () => {
  it('stores the confirmed overrides as the whole settings of the VM, then closes the drawer', () => {
    const { updateVm } = mountVmSettingsEdit()
    const overrides: V2vVmOverrides = { disks: V2V_DISK_OVERRIDES, template: V2V_DEBIAN_TEMPLATE.id }

    const response = getOverlayOptions().events.onConfirm(overrides)

    expect(updateVm).toHaveBeenCalledOnce()
    expect(readV2vStoredListVm()).toStrictEqual({ id: V2V_MAPPED_VM.id, ...overrides })
    expect(response).toBeUndefined()
  })
})
