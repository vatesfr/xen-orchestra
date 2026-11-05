import V2vListLockSummary from '@/modules/v2v/components/selected-vms/V2vListLockSummary.vue'
import type { V2vListLock } from '@/modules/v2v/composables/use-v2v-selected-vms.composable.ts'
import { createV2vListLock } from '@/test/create-v2v-selected-vms.ts'
import { findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

const LIST = createV2vListLock()

function mountLockSummary(props: V2vListLock = LIST) {
  return mount(V2vListLockSummary, { props, global: createGlobalTestConfig() })
}

it('names the source and the destination of the list', () => {
  expect(findCardLabelledValues(mountLockSummary())).toEqual({
    [t('source')]: LIST.sourceHost,
    [t('destination')]: LIST.poolName,
  })
})

it('leaves the values empty while unknown', () => {
  expect(findCardLabelledValues(mountLockSummary({}))).toEqual({
    [t('source')]: '',
    [t('destination')]: '',
  })
})

it('explains that another source or pool has its own list', () => {
  expect(mountLockSummary().get('.note').text()).toBe(t('v2v:list-lock-info'))
})
