import MigrationWizard from '@/modules/v2v/components/wizard/MigrationWizard.vue'
import MigratePage from '@/pages/admin/v2v/migrate.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'

it('renders the migration wizard', () => {
  const wrapper = mount(MigratePage, { global: createGlobalTestConfig({ stubs: { MigrationWizard: true } }) })

  expect(wrapper.findComponent(MigrationWizard).exists()).toBe(true)
})
