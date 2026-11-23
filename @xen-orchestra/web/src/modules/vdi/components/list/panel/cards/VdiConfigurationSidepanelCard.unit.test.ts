import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiConfigurationSidepanelCard from '@/modules/vdi/components/list/panel/cards/VdiConfigurationSidepanelCard.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import VmLinkList from '@/modules/vm/components/VmLinkList.vue'
import { VDI_PAGE_CONTEXT, type VdiPageContext } from '@/shared/constants.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { findCardCopiedValues, findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mockVdiConfigurationCollections, seedVdiVms, VDI_SR_NAME } from '@/test/mock-vdi-configuration-collections.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mount } from '@vue/test-utils'

mockVdiConfigurationCollections()

function mountCard(fromContext: VdiPageContext, vdi: FrontXoVdi = createVdi(), vbd?: FrontXoVbd) {
  return mount(VdiConfigurationSidepanelCard, {
    props: { vdi, vbd, fromContext },
    global: createGlobalTestConfig(),
  })
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
      [t('storage')]: VDI_SR_NAME,
      [t('read-only')]: t('enabled'),
      [t('bootable')]: t('disabled'),
      [t('change-block-tracking')]: t('enabled'),
      [t('operation:snapshot')]: t('disabled'),
    })
  })

  it('copies the format and the name of the SR', () => {
    const wrapper = mountCard(VDI_PAGE_CONTEXT.VM, createVdi({ image_format: 'vhd' }), createVbd())

    expect(findCardCopiedValues(wrapper)).toEqual(['VHD', VDI_SR_NAME])
  })

  it('leaves the storage empty and uncopyable while the SR is unknown', () => {
    xoCollectionsMock.srs.value = []

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

  it('hands the VMs the VDI is plugged into to the VM list', () => {
    const wrapper = mountCard(VDI_PAGE_CONTEXT.SR, createVdi({ $VBDs: seedVdiVms('Web server', 'Database') }))

    expect(
      wrapper
        .getComponent(VmLinkList)
        .props('vms')
        .map(vm => vm.name_label)
    ).toEqual(['Web server', 'Database'])
  })

  it('copies the names of the VMs', () => {
    const wrapper = mountCard(
      VDI_PAGE_CONTEXT.SR,
      createVdi({ image_format: 'vhd', $VBDs: seedVdiVms('Web server', 'Database') })
    )

    expect(findCardCopiedValues(wrapper)).toEqual(['VHD', 'Web server, Database'])
  })

  it('offers nothing to copy for the VMs when the VDI is plugged into none', () => {
    const wrapper = mountCard(VDI_PAGE_CONTEXT.SR, createVdi({ image_format: 'vhd' }))

    expect(findCardCopiedValues(wrapper)).toEqual(['VHD'])
  })
})
