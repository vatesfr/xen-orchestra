import type { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type {
  FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVbd, useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiConfigurationSidepanelCard from '@/modules/vdi/components/list/panel/cards/VdiConfigurationSidepanelCard.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { VDI_PAGE_CONTEXT, type VdiPageContext } from '@/shared/constants.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVm } from '@/test/create-vm.ts'
import { findCardCopiedValues, findCardLabelledValues } from '@/test/find-labelled-values.ts'
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

function mountCard(fromContext: VdiPageContext, vdi: FrontXoVdi = createVdi(), vbd?: FrontXoVbd) {
  return mount(VdiConfigurationSidepanelCard, {
    props: { vdi, vbd, fromContext },
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
  expect(mountCard(VDI_PAGE_CONTEXT.VM).get('.ui-panel-card-title').text()).toBe(t('configuration'))
})

describe('from a VM', () => {
  it('shows the storage, the VBD flags and the VDI settings', () => {
    const wrapper = mountCard(
      VDI_PAGE_CONTEXT.VM,
      createVdi({ image_format: 'qcow2', cbt_enabled: true, tags: ['NOSNAP'] }),
      createVbd({ read_only: true, bootable: false })
    )

    expect(findCardLabelledValues(wrapper)).toEqual({
      [t('format')]: 'QCOW2',
      [t('storage')]: 'Local storage',
      [t('read-only')]: t('enabled'),
      [t('bootable')]: t('disabled'),
      [t('change-block-tracking')]: t('enabled'),
      [t('operation:snapshot')]: t('disabled'),
    })
  })

  it('copies the format and the name of the SR', () => {
    const wrapper = mountCard(VDI_PAGE_CONTEXT.VM, createVdi({ image_format: 'vhd' }), createVbd())

    expect(findCardCopiedValues(wrapper)).toEqual(['VHD', 'Local storage'])
  })

  it('leaves the storage empty and uncopyable while the SR is unknown', () => {
    setSr(undefined)

    const wrapper = mountCard(VDI_PAGE_CONTEXT.VM, createVdi({ image_format: 'vhd' }))

    expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('storage')]: '' })
    expect(findCardCopiedValues(wrapper)).toEqual(['VHD'])
  })
})

describe('from an SR', () => {
  it('lists the VMs instead of the storage, without the VBD flags', () => {
    const wrapper = mountCard(VDI_PAGE_CONTEXT.SR, createVdi(), createVbd())

    expect(Object.keys(findCardLabelledValues(wrapper))).toEqual([
      t('format'),
      t('vms'),
      t('change-block-tracking'),
      t('operation:snapshot'),
    ])
  })

  it('links every VM the VDI is plugged into', () => {
    setVms('Web server', 'Database')

    const wrapper = mountCard(VDI_PAGE_CONTEXT.SR)

    expect(wrapper.findAll('.ui-link-list .ui-link').map(link => link.text())).toEqual(['Web server', 'Database'])
  })

  it('copies the names of the VMs', () => {
    setVms('Web server', 'Database')

    const wrapper = mountCard(VDI_PAGE_CONTEXT.SR, createVdi({ image_format: 'vhd' }))

    expect(findCardCopiedValues(wrapper)).toEqual(['VHD', 'Web server, Database'])
  })

  it('offers nothing to copy for the VMs when the VDI is plugged into none', () => {
    const wrapper = mountCard(VDI_PAGE_CONTEXT.SR, createVdi({ image_format: 'vhd' }))

    expect(findCardCopiedValues(wrapper)).toEqual(['VHD'])
  })
})
