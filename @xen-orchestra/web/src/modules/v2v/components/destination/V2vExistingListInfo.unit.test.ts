import V2vExistingListInfo from '@/modules/v2v/components/destination/V2vExistingListInfo.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { V2V_EXISTING_LIST } from '@/test/v2v-wizard-fixtures.ts'
import { mount } from '@vue/test-utils'

const MIGRATION = t('source-to-destination', {
  source: V2V_EXISTING_LIST.sourceHost,
  destination: V2V_EXISTING_LIST.poolName,
})

function mountInfo() {
  return mount(V2vExistingListInfo, { props: V2V_EXISTING_LIST, global: createGlobalTestConfig() })
}

it('says which migration list this browser already holds, with its VM count', () => {
  expect(mountInfo().text()).toBe(
    t('v2v:existing-list-info', { migration: MIGRATION, vms: t('n-vms', { n: V2V_EXISTING_LIST.vmCount }) })
  )
})

it('highlights the source and the pool of the list', () => {
  expect(mountInfo().get('strong').text()).toBe(MIGRATION)
})

it('is announced as a status', () => {
  expect(mountInfo().attributes('role')).toBe('status')
})
