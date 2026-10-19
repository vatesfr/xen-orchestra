import V2vPoolOption from '@/modules/v2v/components/destination/V2vPoolOption.vue'
import { findParts } from '@/test/find-parts.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

it('shows the pool name with its host, SR and network counts', () => {
  const wrapper = mount(V2vPoolOption, {
    props: { label: 'diskor', counts: { hosts: 1, srs: 4, networks: 6 } },
    global: createGlobalTestConfig(),
  })

  expect(wrapper.get('.label').text()).toBe('diskor')
  expect(findParts(wrapper, '.counts')).toEqual([
    t('n-hosts', { n: 1 }),
    t('n-srs', { n: 4 }),
    t('n-networks', { n: 6 }),
  ])
})

it('shows only the pool name while its counts are unknown', () => {
  const wrapper = mount(V2vPoolOption, { props: { label: 'diskor' }, global: createGlobalTestConfig() })

  expect(wrapper.find('.counts').exists()).toBe(false)
})
