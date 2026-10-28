import V2vVmSourceCard from '@/modules/v2v/components/mapping/V2vVmSourceCard.vue'
import { createV2vVm } from '@/test/create-v2v-inventory.ts'
import { findCardTitle } from '@/test/find-card-title.ts'
import { findParts } from '@/test/find-parts.ts'
import { findLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { V2V_MAPPED_VM } from '@/test/v2v-mapping-fixtures.ts'
import { mount } from '@vue/test-utils'

const VM = createV2vVm({
  ...V2V_MAPPED_VM,
  description: 'Internal API backend',
  memory: 12.5 * 1024 ** 3,
  snapshotCount: 2,
})

function mountCard() {
  return mount(V2vVmSourceCard, { props: { vm: VM, hostName: 'esx01' }, global: createGlobalTestConfig() })
}

it('shows its title', () => {
  expect(findCardTitle(mountCard())).toBe(t('source'))
})

it('shows the facts of the source VM', () => {
  expect(findLabelledValues(mountCard())).toMatchObject({
    [t('power-state')]: t('power-state-on-host', { power: t('vm:status:running'), host: 'esx01' }),
    [t('cpu')]: t('n-vcpus', 4),
    [t('memory')]: '12.5 GiB',
    [t('boot-firmware')]: 'uefi',
    [t('secure-boot')]: t('disabled'),
    [t('snapshots')]: '2',
    [t('description')]: 'Internal API backend',
  })
})

it('lays out the count and the total size of the disks', () => {
  expect(findParts(mountCard(), '.inline-parts')).toEqual(['2', '160 GiB'])
})
