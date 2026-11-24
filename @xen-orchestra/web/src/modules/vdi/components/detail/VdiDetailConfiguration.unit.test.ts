import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiDetailConfiguration from '@/modules/vdi/components/detail/VdiDetailConfiguration.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVdiSnapshot } from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'
import VmLinkList from '@/modules/vm/components/VmLinkList.vue'
import { VDI_PAGE_CONTEXT, type VdiPageContext } from '@/shared/constants.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdiSnapshot } from '@/test/create-vdi-snapshot.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { findLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mockVdiConfigurationCollections, seedVdiVms, VDI_SR_NAME } from '@/test/mock-vdi-configuration-collections.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mount } from '@vue/test-utils'

mockVdiConfigurationCollections()

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
      [t('storage')]: VDI_SR_NAME,
      [t('read-only')]: t('enabled'),
      [t('bootable')]: t('disabled'),
      [t('change-block-tracking')]: t('enabled'),
      [t('operation:snapshot')]: t('disabled'),
    })
  })

  it('leaves the storage empty while the SR is unknown', () => {
    xoCollectionsMock.srs.value = []

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

  it('hands the VMs the VDI is plugged into to the VM list', () => {
    const vdi = createVdi({ $VBDs: seedVdiVms('Web server', 'Database') })

    const wrapper = mountConfiguration({ vdi, fromContext: VDI_PAGE_CONTEXT.SR })

    expect(
      wrapper
        .getComponent(VmLinkList)
        .props('vms')
        .map(vm => vm.name_label)
    ).toEqual(['Web server', 'Database'])
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
      [t('storage')]: VDI_SR_NAME,
    })
  })
})
