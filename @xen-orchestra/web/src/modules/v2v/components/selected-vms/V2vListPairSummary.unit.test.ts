import V2vListPairSummary from '@/modules/v2v/components/selected-vms/V2vListPairSummary.vue'
import type { V2vListPair } from '@/modules/v2v/composables/use-v2v-selected-vms.composable.ts'
import { createV2vListPair } from '@/test/create-v2v-selected-vms.ts'
import { findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

const LIST = createV2vListPair()

function mountListPair(props: V2vListPair = LIST) {
  return mount(V2vListPairSummary, { props, global: createGlobalTestConfig() })
}

it('names the source and the destination of the list', () => {
  expect(findCardLabelledValues(mountListPair())).toEqual({
    [t('source')]: LIST.sourceHost,
    [t('destination')]: LIST.poolName,
  })
})

it('leaves the values empty while unknown', () => {
  expect(findCardLabelledValues(mountListPair({}))).toEqual({
    [t('source')]: '',
    [t('destination')]: '',
  })
})

it('explains that another source or pool has its own list', () => {
  expect(mountListPair().get('.note').text()).toBe(t('v2v:list-pair-info'))
})
