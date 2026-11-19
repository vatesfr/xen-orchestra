import BackupJobBackedUpVmsCard from '@/modules/backup-job/components/list/panel/cards/BackupJobBackedUpVmsCard.vue'
import type { FrontXoVmBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createPool } from '@/test/create-pool.ts'
import { createVm } from '@/test/create-vm.ts'
import { findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { mount } from '@vue/test-utils'

const { vms, pools } = vi.hoisted(() => ({
  vms: [] as FrontXoVm[],
  pools: [] as FrontXoPool[],
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), async () => {
  const { ref } = await import('vue')

  return {
    useXoVmCollection: (() => ({
      vms: ref(vms),
      getVmsByIds: (ids: FrontXoVm['id'][]) => vms.filter(vm => ids.includes(vm.id)),
    })) as unknown as typeof useXoVmCollection,
  }
})

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => ({
    getPoolsByIds: (ids: FrontXoPool['id'][] = []) => pools.filter(pool => ids.includes(pool.id)),
  })) as unknown as typeof useXoPoolCollection,
}))

const firstPool = createPool({ id: 'pool-1' as FrontXoPool['id'], name_label: 'First pool' })
const secondPool = createPool({ id: 'pool-2' as FrontXoPool['id'], name_label: 'Second pool' })

beforeEach(() => {
  vms.splice(
    0,
    vms.length,
    ...Array.from({ length: 6 }, (_, index) =>
      createVm({ id: `vm-${index + 1}` as FrontXoVm['id'], name_label: `VM ${index + 1}`, tags: ['test'] })
    )
  )
  pools.splice(0, pools.length, firstPool, secondPool)
})

function mountBackedUpVmsCard(backedUpVms: FrontXoVmBackupJob['vms']) {
  return mount(BackupJobBackedUpVmsCard, {
    props: { backedUpVms },
    global: createGlobalTestConfig(),
  })
}

function findVmLinks(wrapper: ReturnType<typeof mountBackedUpVmsCard>) {
  return wrapper.findAll('li').map(item => item.getComponent(UiLink))
}

it('lists the VMs picked by hand, linked to their dashboard, without smart mode', () => {
  const wrapper = mountBackedUpVmsCard({ id: { __or: ['vm-1' as FrontXoVm['id'], 'vm-2' as FrontXoVm['id']] } })

  expect(findCardLabelledValues(wrapper)).toEqual({ [t('smart-mode')]: t('disabled') })
  expect(findVmLinks(wrapper).map(link => [link.text(), link.attributes('href')])).toEqual([
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
