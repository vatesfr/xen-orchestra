import BackupJobBackedUpVmsCard from '@/modules/backup-job/components/list/panel/cards/BackupJobBackedUpVmsCard.vue'
import type { FrontXoVmBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createPool } from '@/test/create-pool.ts'
import { createVm } from '@/test/create-vm.ts'
import { findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { vmCollectionMock, mockXoVmCollection } from '@/test/mock-xo-vm-collection.ts'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { findLinks } from '@core-test/find-links.ts'
import { mount } from '@vue/test-utils'

mockXoVmCollection()

mockXoCollections('pool')

const firstPool = createPool({ id: 'pool-1' as FrontXoPool['id'], name_label: 'First pool' })
const secondPool = createPool({ id: 'pool-2' as FrontXoPool['id'], name_label: 'Second pool' })

beforeEach(() => {
  vmCollectionMock.reset()
  xoCollectionsMock.reset()
  vmCollectionMock.vms.value = Array.from({ length: 6 }, (_, index) =>
    createVm({ id: `vm-${index + 1}` as FrontXoVm['id'], name_label: `VM ${index + 1}`, tags: ['test'] })
  )
  xoCollectionsMock.pools.value = [firstPool, secondPool]
})

function mountBackedUpVmsCard(backedUpVms: FrontXoVmBackupJob['vms']) {
  return mount(BackupJobBackedUpVmsCard, {
    props: { backedUpVms },
    global: createGlobalTestConfig(),
  })
}

function findVmLinks(wrapper: ReturnType<typeof mountBackedUpVmsCard>) {
  return wrapper.findAll('li').flatMap(item => findLinks(item))
}

it('lists the VMs picked by hand, linked to their dashboard, without smart mode', () => {
  const wrapper = mountBackedUpVmsCard({ id: { __or: ['vm-1' as FrontXoVm['id'], 'vm-2' as FrontXoVm['id']] } })

  expect(findCardLabelledValues(wrapper)).toEqual({ [t('smart-mode')]: t('disabled') })
  expect(findVmLinks(wrapper)).toEqual([
    ['VM 1', '/vm/vm-1/dashboard'],
    ['VM 2', '/vm/vm-2/dashboard'],
  ])
  expect(wrapper.getComponent(UiPanelCardTitle).props('counter')).toBe(2)
})

it('shows the filters of the smart mode', () => {
  const wrapper = mountBackedUpVmsCard({
    type: 'VM',
    $pool: { __and: [{ __or: [firstPool.id] }, { __not: { __or: [secondPool.id] } }] },
    tags: { __and: [{ __or: [['test']] }, { __not: { __or: [['skip']] } }] },
    power_state: 'Running',
  })

  expect(findCardLabelledValues(wrapper)).toMatchObject({
    [t('smart-mode')]: t('enabled'),
    [t('power-state')]: 'Running',
    [t('resident-on')]: 'First pool',
    [t('not-resident-on')]: 'Second pool',
  })
  expect(wrapper.findAllComponents(VtsTag).map(tag => tag.props('value'))).toEqual(['test', 'skip', 'xo:no-bak'])
})

it('shows the smart mode of a job excluding no tag', () => {
  const wrapper = mountBackedUpVmsCard({ type: 'VM', tags: { __or: [['test']] } })

  expect(wrapper.findAllComponents(VtsTag).map(tag => tag.props('value'))).toEqual(['test', 'xo:no-bak'])
})

it('shows the first backed up VMs, offering to see the other ones', () => {
  const wrapper = mountBackedUpVmsCard({ type: 'VM', tags: { __or: [['test']] } })

  expect(wrapper.getComponent(UiPanelCardTitle).props('counter')).toBe(6)
  expect(wrapper.text()).toContain(t('action:see-n-more', { n: 1 }))
})
