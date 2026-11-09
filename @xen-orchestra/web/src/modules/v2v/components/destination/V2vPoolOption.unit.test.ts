import V2vPoolOption from '@/modules/v2v/components/destination/V2vPoolOption.vue'
import type { V2vPoolResourceCounts } from '@/modules/v2v/utils/v2v-destination.util.ts'
import { findParts } from '@/test/find-parts.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

function mountPoolOption(counts?: V2vPoolResourceCounts) {
  return mount(V2vPoolOption, { props: { label: 'diskor', counts }, global: createGlobalTestConfig() })
}

it('shows the pool name with its host, SR and network counts', () => {
  const wrapper = mountPoolOption({ hosts: 1, srs: 4, networks: 6 })

  expect(wrapper.get('.label').text()).toBe('diskor')
  expect(findParts(wrapper, '.counts')).toEqual([
    t('n-hosts', { n: 1 }),
    t('n-srs', { n: 4 }),
    t('n-networks', { n: 6 }),
  ])
})

it('shows only the pool name while its counts are unknown', () => {
  const wrapper = mountPoolOption()

  expect(wrapper.find('.counts').exists()).toBe(false)
})
