import type { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type {
  FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useDuplicateVmForm } from '@/modules/vm/form/use-duplicate-vm-form.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVm } from '@/test/create-vm.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { VM_POWER_STATE } from '@vates/types'
import { computed, nextTick, ref } from 'vue'

const { useXoSrCollectionMock, useXoPbdCollectionMock, getSrLocation } = vi.hoisted(() => ({
  useXoSrCollectionMock: vi.fn(),
  useXoPbdCollectionMock: vi.fn(),
  getSrLocation: vi.fn(),
}))

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: useXoSrCollectionMock as unknown as typeof useXoSrCollection,
}))

vi.mock(import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'), () => ({
  useXoPbdCollection: useXoPbdCollectionMock as unknown as typeof useXoPbdCollection,
}))

vi.mock(import('@/modules/storage-repository/composables/xo-sr-utils.composable.ts'), () => ({
  useXoSrUtils: (() => ({ getSrLocation })) as unknown as typeof useXoSrUtils,
}))

beforeEach(() => {
  useXoSrCollectionMock.mockReset()
  useXoPbdCollectionMock.mockReset()
  getSrLocation.mockReset()

  useXoSrCollectionMock.mockReturnValue({ srs: computed(() => []) })
  useXoPbdCollectionMock.mockReturnValue({ pbdsBySr: computed(() => new Map()) })
  getSrLocation.mockReturnValue('Local')
})

function mountDuplicateVmForm(vm: FrontXoVm = createVm()) {
  return mountComposable(() => useDuplicateVmForm(vm)).wrapper.vm
}

describe('formData', () => {
  it('suggests a copy name derived from the VM name', () => {
    const result = mountDuplicateVmForm(createVm({ name_label: 'Web server' }))

    expect(result.formData.name).toBe('Web server_COPY')
  })

  it('defaults to a fast clone for a halted VM', () => {
    const result = mountDuplicateVmForm(createVm({ power_state: VM_POWER_STATE.HALTED }))

    expect(result.formData.copyMode).toBe('fastClone')
  })

  it('defaults to a full copy for a running VM', () => {
    const result = mountDuplicateVmForm(createVm({ power_state: VM_POWER_STATE.RUNNING }))

    expect(result.formData.copyMode).toBe('fullCopy')
  })

  it('defaults to no compression', () => {
    const result = mountDuplicateVmForm()

    expect(result.formData.compressionMode).toBe('disabled')
  })

  it('switches a fast clone back to a full copy when the VM stops being halted', async () => {
    const vm = ref(createVm({ power_state: VM_POWER_STATE.HALTED }))
    const { wrapper } = mountComposable(() => useDuplicateVmForm(vm))

    expect(wrapper.vm.formData.copyMode).toBe('fastClone')

    vm.value = createVm({ power_state: VM_POWER_STATE.RUNNING })
    await nextTick()

    expect(wrapper.vm.formData.copyMode).toBe('fullCopy')
  })
})

describe('copyModeOptions', () => {
  it('allows a fast clone only for a halted VM', () => {
    const result = mountDuplicateVmForm(createVm({ power_state: VM_POWER_STATE.HALTED }))

    expect(result.copyModeOptions).toEqual([
      { label: 'Fast clone', value: 'fastClone', disabled: false },
      { label: 'Full copy', value: 'fullCopy' },
    ])
  })

  it('disables the fast clone for a running VM', () => {
    const result = mountDuplicateVmForm(createVm({ power_state: VM_POWER_STATE.RUNNING }))

    expect(result.copyModeOptions).toMatchObject([{ value: 'fastClone', disabled: true }, { value: 'fullCopy' }])
  })
})

describe('compressionModeOptions', () => {
  it('offers no compression, GZIP and ZSTD', () => {
    const result = mountDuplicateVmForm()

    expect(result.compressionModeOptions).toEqual([
      { label: 'Disabled', value: 'disabled' },
      { label: 'GZIP', value: 'gzip' },
      { label: 'ZSTD', value: 'zstd' },
    ])
  })
})

describe('isCrossPool', () => {
  it('is true when the selected SR belongs to another pool than the VM', () => {
    const result = mountDuplicateVmForm(createVm({ $pool: 'pool-789' as FrontXoVm['$pool'] }))

    result.formData.sr = createSr({ $pool: 'pool-other' as FrontXoSr['$pool'] })

    expect(result.isCrossPool).toBe(true)
  })

  it('is false when the selected SR belongs to the pool of the VM', () => {
    const result = mountDuplicateVmForm(createVm({ $pool: 'pool-789' as FrontXoVm['$pool'] }))

    result.formData.sr = createSr({ $pool: 'pool-789' as FrontXoSr['$pool'] })

    expect(result.isCrossPool).toBe(false)
  })

  it('is false while no SR is selected', () => {
    const result = mountDuplicateVmForm()

    expect(result.isCrossPool).toBe(false)
  })
})

describe('validateAndBuildPayload', () => {
  it('builds a fast-clone payload from the form name', async () => {
    const result = mountDuplicateVmForm(createVm({ power_state: VM_POWER_STATE.HALTED }))

    result.formData.name = 'Web server copy'

    await expect(result.validateAndBuildPayload()).resolves.toEqual({ name_label: 'Web server copy', fast: true })
  })

  it('builds a full-copy payload targeting the selected SR', async () => {
    const result = mountDuplicateVmForm()

    result.formData.name = 'Web server copy'
    result.formData.sr = createSr({ id: 'sr-42' as FrontXoSr['id'] })

    await expect(result.validateAndBuildPayload()).resolves.toEqual({
      name_label: 'Web server copy',
      srId: 'sr-42',
    })
  })

  it('adds the compression to a full-copy payload when one is selected', async () => {
    const result = mountDuplicateVmForm()

    result.formData.name = 'Web server copy'
    result.formData.sr = createSr({ id: 'sr-42' as FrontXoSr['id'] })
    result.formData.compressionMode = 'zstd'

    await expect(result.validateAndBuildPayload()).resolves.toEqual({
      name_label: 'Web server copy',
      srId: 'sr-42',
      compress: 'zstd',
    })
  })

  it('builds no payload when the name is empty', async () => {
    const result = mountDuplicateVmForm(createVm({ power_state: VM_POWER_STATE.HALTED }))

    result.formData.name = ''

    await expect(result.validateAndBuildPayload()).resolves.toBeUndefined()
  })

  it('builds no payload when a full copy has no target SR', async () => {
    const result = mountDuplicateVmForm()

    result.formData.name = 'Web server copy'
    result.formData.sr = undefined

    await expect(result.validateAndBuildPayload()).resolves.toBeUndefined()
  })
})
