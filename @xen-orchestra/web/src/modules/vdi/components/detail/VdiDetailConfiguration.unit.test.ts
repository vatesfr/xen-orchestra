import type { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVbd, useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiDetailConfiguration from '@/modules/vdi/components/detail/VdiDetailConfiguration.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVdiSnapshot } from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'
import type { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { VDI_PAGE_CONTEXT, type VdiPageContext } from '@/shared/constants.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdiSnapshot } from '@/test/create-vdi-snapshot.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVm } from '@/test/create-vm.ts'
import { findLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'

const { useGetSrById, isDefaultSr, useGetVbdsByIds, useGetVmsByIds, getPbdsByIds } = vi.hoisted(() => ({
  useGetSrById: vi.fn(),
  isDefaultSr: vi.fn(),
  useGetVbdsByIds: vi.fn(),
  useGetVmsByIds: vi.fn(),
  getPbdsByIds: vi.fn(),
}))

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: (() => ({ useGetSrById, isDefaultSr })) as unknown as typeof useXoSrCollection,
}))

vi.mock(import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'), () => ({
  useXoVbdCollection: (() => ({ useGetVbdsByIds })) as unknown as typeof useXoVbdCollection,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({ useGetVmsByIds })) as unknown as typeof useXoVmCollection,
}))

vi.mock(import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'), () => ({
  useXoPbdCollection: (() => ({ getPbdsByIds })) as unknown as typeof useXoPbdCollection,
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({})) as unknown as typeof useXoHostCollection,
}))

beforeEach(() => {
  useGetSrById.mockReset()
  isDefaultSr.mockReset()
  useGetVbdsByIds.mockReset()
  useGetVmsByIds.mockReset()
  getPbdsByIds.mockReset()

  useGetSrById.mockReturnValue(computed(() => createSr({ name_label: 'Fast SR' })))
  isDefaultSr.mockReturnValue(false)
  useGetVbdsByIds.mockReturnValue(computed(() => []))
  useGetVmsByIds.mockReturnValue(computed(() => [createVm({ name_label: 'Web server' })]))
  getPbdsByIds.mockReturnValue([])
})

function mountConfiguration(props: {
  vdi?: FrontXoVdi
  vdiSnapshot?: FrontXoVdiSnapshot
  vbd?: FrontXoVbd
  fromContext?: VdiPageContext
}) {
  return mount(VdiDetailConfiguration, {
    props,
    global: createGlobalTestConfig(),
  })
}

it('shows the storage and the VBD flags of a VDI opened from a VM', () => {
  const wrapper = mountConfiguration({
    vdi: createVdi({ image_format: 'qcow2', cbt_enabled: true, tags: ['NOSNAP'] }),
    vbd: createVbd({ read_only: true, bootable: false }),
    fromContext: VDI_PAGE_CONTEXT.VM,
  })

  expect(findLabelledValues(wrapper)).toEqual({
    [t('format')]: 'QCOW2',
    [t('storage')]: 'Fast SR',
    [t('read-only')]: t('enabled'),
    [t('bootable')]: t('disabled'),
    [t('change-block-tracking')]: t('enabled'),
    [t('operation:snapshot')]: t('disabled'),
  })
})

it('shows the VMs instead of the storage and the VBD flags for a VDI opened from an SR', () => {
  const wrapper = mountConfiguration({
    vdi: createVdi({ image_format: 'vhd', cbt_enabled: false, tags: [] }),
    fromContext: VDI_PAGE_CONTEXT.SR,
  })

  expect(findLabelledValues(wrapper)).toEqual({
    [t('format')]: 'VHD',
    [t('vms')]: 'Web server',
    [t('change-block-tracking')]: t('disabled'),
    [t('operation:snapshot')]: t('enabled'),
  })
})

it('shows the storage without the VBD flags for a VDI opened from another context', () => {
  const wrapper = mountConfiguration({ vdi: createVdi(), fromContext: VDI_PAGE_CONTEXT.SNAPSHOT })

  expect(Object.keys(findLabelledValues(wrapper))).toEqual([
    t('format'),
    t('storage'),
    t('change-block-tracking'),
    t('operation:snapshot'),
  ])
})

it('hides the change block tracking and snapshot rows for a VDI snapshot', () => {
  const wrapper = mountConfiguration({
    vdiSnapshot: createVdiSnapshot({ image_format: 'raw' }),
    fromContext: VDI_PAGE_CONTEXT.VDI_SNAPSHOT,
  })

  expect(findLabelledValues(wrapper)).toEqual({
    [t('format')]: 'RAW',
    [t('storage')]: 'Fast SR',
  })
})

it('leaves the storage empty while the SR is not resolved', () => {
  useGetSrById.mockReturnValue(computed(() => undefined))

  const wrapper = mountConfiguration({ vdi: createVdi(), fromContext: VDI_PAGE_CONTEXT.VM })

  expect(findLabelledValues(wrapper)[t('storage')]).toBe('')
})
