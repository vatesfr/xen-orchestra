import V2vDestinationVmCard from '@/modules/v2v/components/mapping/V2vDestinationVmCard.vue'
import type { V2vDestinationVm } from '@/modules/v2v/types/v2v-destination-vm.type.ts'
import { DISKOR_POOL_NAME } from '@/test/create-pool.ts'
import { findInlineParts } from '@/test/find-parts.ts'
import { findPanelCardTitleLabel } from '@/test/find-titles.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { V2V_RESUMED_IMPORT_VM } from '@/test/v2v-mapping-fixtures.ts'
import { objectIcon } from '@core/icons'
import { findLink } from '@core-test/find-links.ts'
import { mount } from '@vue/test-utils'

const VM: V2vDestinationVm = {
  id: V2V_RESUMED_IMPORT_VM.id,
  name: 'app-03',
  icon: objectIcon('vm', 'halted'),
  powerLabel: 'Halted',
}

function mountCard() {
  return mount(V2vDestinationVmCard, {
    props: { vm: VM, poolName: DISKOR_POOL_NAME },
    global: createGlobalTestConfig(),
  })
}

it('shows its title', () => {
  expect(findPanelCardTitleLabel(mountCard())).toBe(t('destination-vm'))
})

it('links the VM to its page, with the icon of its power state', () => {
  expect(findLink(mountCard())).toEqual({
    text: 'app-03',
    href: `/vm/${V2V_RESUMED_IMPORT_VM.id}/dashboard`,
    icon: objectIcon('vm', 'halted'),
  })
})

it('lays out the pool of the VM, its power state and its blocked start', () => {
  expect(findInlineParts(mountCard())).toEqual([
    t('pool-named', { name: DISKOR_POOL_NAME }),
    'Halted',
    t('v2v:start-blocked-partial'),
  ])
})
