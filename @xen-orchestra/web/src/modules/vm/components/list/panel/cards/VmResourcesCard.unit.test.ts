import VmResourcesCard from '@/modules/vm/components/list/panel/cards/VmResourcesCard.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { itRendersCardTitle } from '@/test/card-title.ts'
import { createVm } from '@/test/create-vm.ts'
import { findPanelCardTitleLabel } from '@/test/find-card-title.ts'
import { findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { vmDeviceCollectionsMock, mockXoVmDeviceCollections } from '@/test/mock-xo-vm-device-collections.ts'
import { seedVmDisks } from '@/test/seed-vm-disks.ts'
import { mount } from '@vue/test-utils'

mockXoVmDeviceCollections('vbd', 'vdi')

beforeEach(() => {
  vmDeviceCollectionsMock.reset()
})

function mountResourcesCard(vm: FrontXoVm = createVm()) {
  return mount(VmResourcesCard, {
    props: { vm },
    global: createGlobalTestConfig(),
  })
}

itRendersCardTitle(mountResourcesCard, t('resources'), findPanelCardTitleLabel)

it('shows the vCPU count, the formatted RAM and the summed disk space of the VM', () => {
  const wrapper = mountResourcesCard(
    createVm({
      $VBDs: seedVmDisks([{ vdi: { size: 1073741824 } }, { vdi: { size: 2147483648 } }]),
      CPUs: { number: 2, max: 4 },
      memory: { size: 4294967296, dynamic: [0, 0], static: [0, 0] },
      snapshots: ['snapshot-1'] as FrontXoVm['snapshots'],
    })
  )

  expect(findCardLabelledValues(wrapper)).toEqual({
    [t('vcpus')]: '2',
    [t('ram')]: '4 GiB',
    [t('disk-space')]: '3 GiB',
    [t('vdis')]: '2',
    [t('snapshots')]: '1',
  })
})

it('ignores the VBDs whose VDI cannot be resolved when summing the disk space', () => {
  const vm = createVm({ $VBDs: seedVmDisks([{ vdi: { size: 1073741824 } }, {}]) })

  expect(findCardLabelledValues(mountResourcesCard(vm))).toMatchObject({ [t('disk-space')]: '1 GiB' })
})

it('leaves the VDI and snapshot counts empty when the VM has none', () => {
  const wrapper = mountResourcesCard(createVm({ $VBDs: [], snapshots: [] }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({
    [t('vdis')]: '',
    [t('snapshots')]: '',
    [t('disk-space')]: '0 B',
  })
})
