import UiOverridden from '@core/components/ui/overridden/UiOverridden.vue'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { mount } from '@vue/test-utils'

function mountOverridden(label?: string) {
  return mount(UiOverridden, {
    slots: label === undefined ? {} : { default: label },
    global: createGlobalTestConfig(),
  })
}

it('renders only the dot when no label is given', () => {
  const wrapper = mountOverridden()

  expect(wrapper.text()).toBe('')
  expect(wrapper.find('.typo-body-regular-small').exists()).toBe(false)
})

it('reads the label it is given', () => {
  expect(mountOverridden('Added').text()).toBe('Added')
})
