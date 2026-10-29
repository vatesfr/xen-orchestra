import V2vLaunchOptionSelect from '@/modules/v2v/components/review/V2vLaunchOptionSelect.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { findSelectedLabels, openSelect, pickSelectOption } from '@/test/select.ts'
import { flushPromises, mount } from '@vue/test-utils'

// What the select offers and shows belongs to useV2vLaunchOptionSelect: here only the wiring matters
async function mountSelect(modelValue: boolean | undefined, defaultValue = true) {
  const wrapper = mount(V2vLaunchOptionSelect, {
    props: { modelValue, defaultValue, 'onUpdate:modelValue': () => {} },
    global: createGlobalTestConfig(),
  })
  await flushPromises()

  return wrapper
}

it('follows the default value it is given', async () => {
  const wrapper = await mountSelect(undefined)

  await wrapper.setProps({ defaultValue: false })

  expect(findSelectedLabels(wrapper)).toEqual([t('default-value', { value: t('option-off') })])
})

it('emits the value picked', async () => {
  const wrapper = await mountSelect(undefined)

  await openSelect(wrapper)
  await pickSelectOption(wrapper, t('option-off'))

  expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
})
