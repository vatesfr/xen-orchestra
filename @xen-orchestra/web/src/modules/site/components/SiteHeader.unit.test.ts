import SiteHeader from '@/modules/site/components/SiteHeader.vue'
import { findHeadBarActionLink, findHeadBarLabel } from '@/test/find-head-bar.ts'
import { findActiveTabLabels, findInAppTabHrefs, findTabLabels } from '@/test/find-tabs.ts'
import { createGlobalTestConfigAt } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

async function mountHeader(initialPath?: string) {
  return mount(SiteHeader, { global: await createGlobalTestConfigAt(initialPath) })
}

it('names the appliance', async () => {
  const wrapper = await mountHeader()

  expect(findHeadBarLabel(wrapper)).toBe('Xen Orchestra Appliance')
})

it('lists every tab of the appliance, in order', async () => {
  const wrapper = await mountHeader()

  expect(findTabLabels(wrapper)).toEqual([t('dashboard'), t('backups'), t('tasks'), t('pools'), t('hosts'), t('vms')])
})

it('points every tab at its site page', async () => {
  const wrapper = await mountHeader()

  expect(findInAppTabHrefs(wrapper)).toEqual(['/dashboard', '/backups', '/tasks', '/pools', '/hosts', '/vms'])
})

it('marks the tab of the current route as the active one', async () => {
  const wrapper = await mountHeader('/pools')

  expect(findActiveTabLabels(wrapper)).toEqual([t('pools')])
})

it('marks no tab as active while no site page is open', async () => {
  const wrapper = await mountHeader()

  expect(findActiveTabLabels(wrapper)).toEqual([])
})

it('offers to connect a pool', async () => {
  const wrapper = await mountHeader()

  const connectPoolLink = findHeadBarActionLink(wrapper)

  expect(connectPoolLink.text()).toBe(t('action:connect-pool'))
  expect(connectPoolLink.attributes('href')).toBe('/pool/connect')
})
