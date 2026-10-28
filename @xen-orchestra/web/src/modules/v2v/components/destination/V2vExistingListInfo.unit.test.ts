import V2vExistingListInfo from '@/modules/v2v/components/destination/V2vExistingListInfo.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

const MIGRATION = t('source-to-destination', { source: 'vcenter-prod.lab', destination: 'diskor' })

function mountInfo() {
  return mount(V2vExistingListInfo, {
    props: { sourceHost: 'vcenter-prod.lab', poolName: 'diskor', vmCount: 4 },
    global: createGlobalTestConfig(),
  })
}

it('says which migration list this browser already holds, with its VM count', () => {
  expect(mountInfo().text()).toBe(t('v2v:existing-list-info', { migration: MIGRATION, vms: t('n-vms', { n: 4 }) }))
})

it('highlights the source and the pool of the list', () => {
  expect(mountInfo().get('strong').text()).toBe(MIGRATION)
})

it('is announced as a status', () => {
  expect(mountInfo().attributes('role')).toBe('status')
})
