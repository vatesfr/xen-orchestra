import V2vValueOrigin from '@/modules/v2v/components/mapping/V2vValueOrigin.vue'
import type { V2vTargetOrigin } from '@/modules/v2v/types/v2v-mapping.type.ts'
import { findAccentedTags } from '@/test/find-accented-labels.ts'
import { findButton, getButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

function mountOrigin(origin: V2vTargetOrigin) {
  return mount(V2vValueOrigin, { props: { origin }, global: createGlobalTestConfig() })
}

it.each([
  ['default', 'global-default', 'neutral'],
  ['overridden', 'overridden', 'warning'],
] as const)('tags a %s value', (origin, labelKey, accent) => {
  expect(findAccentedTags(mountOrigin(origin))).toEqual([{ label: t(labelKey), accent }])
})

it('offers no reset of a default value', () => {
  expect(findButton(mountOrigin('default'), t('action:reset-to-default'))).toBeUndefined()
})

it('resets an overridden value', async () => {
  const wrapper = mountOrigin('overridden')

  await getButton(wrapper, t('action:reset-to-default')).trigger('click')

  expect(wrapper.emitted('reset')).toEqual([[]])
})
