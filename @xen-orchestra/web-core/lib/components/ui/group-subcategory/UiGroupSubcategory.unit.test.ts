import UiGroupSubcategory from '@core/components/ui/group-subcategory/UiGroupSubcategory.vue'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { mount } from '@vue/test-utils'

function mountGroupSubcategory(slots: Record<string, string> = {}) {
  return mount(UiGroupSubcategory, {
    global: createGlobalTestConfig(),
    slots: { default: 'Into a pool', ...slots },
  })
}

it('renders the title', () => {
  expect(mountGroupSubcategory().get('.title').text()).toBe('Into a pool')
})

it('renders the info only when it is given', () => {
  expect(mountGroupSubcategory({ info: 'Writes to a pool' }).get('.info').text()).toBe('Writes to a pool')
  expect(mountGroupSubcategory().find('.info').exists()).toBe(false)
})
