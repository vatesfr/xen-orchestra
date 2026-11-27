import NetworksTable from '@/modules/network/components/NetworksTable.vue'
import { findTitles } from '@/test/find-titles.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mockXoCollections } from '@/test/mock-xo-collections.ts'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import { mount } from '@vue/test-utils'

mockXoCollections('pif')

function mountTable(type?: 'internal' | 'private') {
  return mount(NetworksTable, { props: { networks: [], type }, global: createGlobalTestConfig() })
}

function findAlerts(wrapper: ReturnType<typeof mountTable>) {
  return wrapper.findAllComponents(UiAlert).map(alert => alert.text())
}

it('titles the networks of the pool, without alert', () => {
  const wrapper = mountTable()

  expect(findTitles(wrapper)).toEqual([t('networks')])
  expect(findAlerts(wrapper)).toEqual([])
})

it('titles the private networks, without alert', () => {
  const wrapper = mountTable('private')

  expect(findTitles(wrapper)).toEqual([t('private-network', 2)])
  expect(findAlerts(wrapper)).toEqual([])
})

it('titles the internal networks, and explains what they are', () => {
  const wrapper = mountTable('internal')

  expect(findTitles(wrapper)).toEqual([t('host-internal-networks')])
  expect(findAlerts(wrapper)).toEqual([t('host-internal-networks-info')])
})
