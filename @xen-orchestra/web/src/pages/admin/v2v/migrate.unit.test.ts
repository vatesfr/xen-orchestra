import MigratePage from '@/pages/admin/v2v/migrate.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { V2vConnectionReader } from '@/test/v2v-connection-reader.ts'
import { mount } from '@vue/test-utils'

it('renders the migration wizard with a new V2V connection', () => {
  const wrapper = mount(MigratePage, {
    global: createGlobalTestConfig({ stubs: { V2vMigrationWizard: V2vConnectionReader } }),
  })

  expect(wrapper.getComponent(V2vConnectionReader).vm.context.connection.value).toBeUndefined()
})
