import V2vMigrationWizard from '@/modules/v2v/components/wizard/V2vMigrationWizard.vue'
import MigratePage from '@/pages/admin/v2v/migrate.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'

it('renders the migration wizard', () => {
  const wrapper = mount(MigratePage, { global: { ...createGlobalTestConfig(), stubs: { V2vMigrationWizard: true } } })

  expect(wrapper.findComponent(V2vMigrationWizard).exists()).toBe(true)
})
