import V2vDestinationVmCard from '@/modules/v2v/components/mapping/V2vDestinationVmCard.vue'
import type { V2vDestinationVm } from '@/modules/v2v/composables/use-v2v-resumed-vm.composable.ts'
import { DISKOR_POOL_NAME } from '@/test/create-pool.ts'
import { findAccentedInfos } from '@/test/find-accented-labels.ts'
import { findCardTitle } from '@/test/find-card-title.ts'
import { findParts } from '@/test/find-parts.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { V2V_RESUMED_IMPORT_VM } from '@/test/v2v-mapping-fixtures.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { objectIcon } from '@core/icons'
import { V2V_PARTIAL_IMPORT_TAG } from '@vates/types'
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
  expect(findCardTitle(mountCard())).toBe(t('destination-vm'))
})

it('links the VM to its page, with the icon of its power state', () => {
  const link = mountCard().getComponent(UiLink)

  expect([link.text(), link.attributes('href'), link.props('icon')]).toEqual([
    'app-03',
    `/vm/${V2V_RESUMED_IMPORT_VM.id}/dashboard`,
    objectIcon('vm', 'halted'),
  ])
})

it('lays out the pool of the VM, its power state and its blocked start', () => {
  expect(findParts(mountCard(), '.inline-parts')).toEqual([
    t('pool-named', { name: DISKOR_POOL_NAME }),
    'Halted',
    t('v2v:start-blocked-partial'),
  ])
})

it('tells the VM is excluded from backups until the cutover', () => {
  expect(findAccentedInfos(mountCard())).toEqual([
    { label: t('v2v:no-bak-info', { tag: V2V_PARTIAL_IMPORT_TAG }), accent: 'info' },
  ])
})
