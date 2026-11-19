import UiOverridden from '@core/components/ui/overridden/UiOverridden.vue'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { t } from '@core-test/i18n.ts'
import { mount } from '@vue/test-utils'

function mountOverridden(label?: string) {
  return mount(UiOverridden, {
    slots: label === undefined ? {} : { default: label },
    global: createGlobalTestConfig(),
  })
}

it('reads "overridden" by default', () => {
  expect(mountOverridden().text()).toBe(t('overridden'))
})

it('reads the label it is given instead', () => {
  expect(mountOverridden('Added').text()).toBe('Added')
})
