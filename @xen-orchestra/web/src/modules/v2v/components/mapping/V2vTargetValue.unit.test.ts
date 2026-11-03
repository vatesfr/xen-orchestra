import V2vTargetValue from '@/modules/v2v/components/mapping/V2vTargetValue.vue'
import V2vValueOrigin from '@/modules/v2v/components/mapping/V2vValueOrigin.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { V2V_SSD_SR, V2V_TARGET_OPTIONS } from '@/test/v2v-mapping-fixtures.ts'
import { mount } from '@vue/test-utils'

const TARGET = { value: V2V_SSD_SR.id, origin: 'overridden', isOffered: true } as const

function mountValue(options = V2V_TARGET_OPTIONS.srs) {
  return mount(V2vTargetValue, { props: { target: TARGET, options }, global: createGlobalTestConfig() })
}

it('names the target, and where it comes from, without a reset', () => {
  const wrapper = mountValue()

  expect(wrapper.text()).toBe(`${V2V_SSD_SR.name_label} ${t('overridden')}`)
  expect(wrapper.getComponent(V2vValueOrigin).props()).toEqual({ origin: 'overridden', readonly: true })
})

it('names a target the pool does not offer, or not yet, by its id', () => {
  expect(mountValue([]).text()).toBe(`${V2V_SSD_SR.id} ${t('overridden')}`)
})
