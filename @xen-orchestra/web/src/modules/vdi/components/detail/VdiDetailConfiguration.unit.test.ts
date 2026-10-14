import type { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type {
  FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVbd, useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiDetailConfiguration from '@/modules/vdi/components/detail/VdiDetailConfiguration.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVdiSnapshot } from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
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

const { useGetSrById, useGetVmsByIds } = vi.hoisted(() => ({
  useGetSrById: vi.fn(),
  useGetVmsByIds: vi.fn(),
}))

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: (() => ({ useGetSrById, isDefaultSr: () => false })) as unknown as typeof useXoSrCollection,
}))

vi.mock(import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'), () => ({
  useXoVbdCollection: (() => ({ useGetVbdsByIds: () => computed(() => []) })) as unknown as typeof useXoVbdCollection,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({ useGetVmsByIds })) as unknown as typeof useXoVmCollection,
}))

vi.mock(import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'), () => ({
  useXoPbdCollection: (() => ({ getPbdsByIds: () => [] })) as unknown as typeof useXoPbdCollection,
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({})) as unknown as typeof useXoHostCollection,
}))

beforeEach(() => {
  useGetSrById.mockReset()
  useGetVmsByIds.mockReset()
  useGetSrById.mockReturnValue(computed(() => createSr({ name_label: 'Local storage' })))
  useGetVmsByIds.mockReturnValue(computed(() => []))
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

function setSr(sr: FrontXoSr | undefined) {
  useGetSrById.mockReturnValue(computed(() => sr))
}

function setVms(...names: string[]) {
  useGetVmsByIds.mockReturnValue(
    computed(() => names.map((name, index) => createVm({ id: `vm-${index}` as FrontXoVm['id'], name_label: name })))
  )
}

it('renders the card title', () => {
  const wrapper = mountConfiguration({ vdi: createVdi(), fromContext: VDI_PAGE_CONTEXT.VM })

  expect(wrapper.get('.ui-title').text()).toBe(t('configuration'))
})

describe('from a VM', () => {
  it('shows the storage, the VBD flags and the VDI settings', () => {
    const wrapper = mountConfiguration({
      vdi: createVdi({ image_format: 'qcow2', cbt_enabled: true, tags: ['NOSNAP'] }),
      vbd: createVbd({ read_only: true, bootable: false }),
      fromContext: VDI_PAGE_CONTEXT.VM,
    })

    expect(findLabelledValues(wrapper)).toEqual({
      [t('format')]: 'QCOW2',
      [t('storage')]: 'Local storage',
      [t('read-only')]: t('enabled'),
      [t('bootable')]: t('disabled'),
      [t('change-block-tracking')]: t('enabled'),
      [t('operation:snapshot')]: t('disabled'),
    })
  })

  it('leaves the storage empty while the SR is unknown', () => {
    setSr(undefined)

    const wrapper = mountConfiguration({ vdi: createVdi(), fromContext: VDI_PAGE_CONTEXT.VM })

    expect(findLabelledValues(wrapper)).toMatchObject({ [t('storage')]: '' })
  })
})

describe('from an SR', () => {
  it('lists the VMs instead of the storage, without the VBD flags', () => {
    const wrapper = mountConfiguration({ vdi: createVdi(), vbd: createVbd(), fromContext: VDI_PAGE_CONTEXT.SR })

    expect(Object.keys(findLabelledValues(wrapper))).toEqual([
      t('format'),
      t('vms'),
      t('change-block-tracking'),
      t('operation:snapshot'),
    ])
  })

  it('links every VM the VDI is plugged into', () => {
    setVms('Web server', 'Database')

    const wrapper = mountConfiguration({ vdi: createVdi(), fromContext: VDI_PAGE_CONTEXT.SR })

    expect(wrapper.findAll('.vm-link-list .ui-link').map(link => link.text())).toEqual(['Web server', 'Database'])
  })
})

describe('from a VDI snapshot', () => {
  it('shows the format and the storage only', () => {
    const wrapper = mountConfiguration({
      vdiSnapshot: createVdiSnapshot({ image_format: 'vhd' }),
      fromContext: VDI_PAGE_CONTEXT.VDI_SNAPSHOT,
    })

    expect(findLabelledValues(wrapper)).toEqual({
      [t('format')]: 'VHD',
      [t('storage')]: 'Local storage',
    })
  })
})
