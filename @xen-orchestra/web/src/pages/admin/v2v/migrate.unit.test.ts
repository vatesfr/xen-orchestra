import V2vMigrationWizard from '@/modules/v2v/components/wizard/V2vMigrationWizard.vue'
import { useV2vConnection } from '@/modules/v2v/composables/use-v2v-connection.composable.ts'
import MigratePage from '@/pages/admin/v2v/migrate.vue'
import { createV2vConnection } from '@/test/create-v2v-connection.ts'
import { createV2vInventory } from '@/test/create-v2v-inventory.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'

it('renders the migration wizard', () => {
  const wrapper = mount(MigratePage, { global: { ...createGlobalTestConfig(), stubs: { V2vMigrationWizard: true } } })

  expect(wrapper.findComponent(V2vMigrationWizard).exists()).toBe(true)
})

it('forgets the connection and its inventory once the wizard is closed', () => {
  const Wizard = defineComponent({ setup: () => ({ context: useV2vConnection() }), render: () => null })

  const mountPage = () =>
    mount(MigratePage, { global: { ...createGlobalTestConfig(), stubs: { V2vMigrationWizard: Wizard } } })

  const closedPage = mountPage()
  closedPage.getComponent(Wizard).vm.context.setConnection(createV2vConnection(), createV2vInventory())
  closedPage.unmount()

  const { context } = mountPage().getComponent(Wizard).vm

  expect(context.connection.value).toBeUndefined()
  expect(context.inventory.value).toBeUndefined()
})
