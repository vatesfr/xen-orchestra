import NewProxyDrawer from '@/modules/appliance/components/drawer/NewProxyDrawer.vue'
import { cancelDrawer, findDrawerButtonLabels, submitDrawer } from '@/test/drawer.ts'
import { getInputWrapper } from '@/test/find-input-labels.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount, type VueWrapper } from '@vue/test-utils'

function mountDrawer() {
  return mount(NewProxyDrawer, { global: createGlobalTestConfig(), attachTo: document.body })
}

async function fill(wrapper: VueWrapper, label: string, value: string) {
  await getInputWrapper(wrapper, label).get('input').setValue(value)
}

it('shows its title', () => {
  expect(mountDrawer().get('.ui-drawer .header').text()).toBe(t('action:add-proxy'))
})

it('offers to cancel or to add the proxy', () => {
  expect(findDrawerButtonLabels(mountDrawer())).toEqual([t('cancel'), t('action:add-proxy')])
})

it('cancels from the cancel button', async () => {
  const wrapper = mountDrawer()

  await cancelDrawer(wrapper)

  expect(wrapper.emitted('cancel')).toHaveLength(1)
  expect(wrapper.emitted('confirm')).toBeUndefined()
})

it('confirms with the proxy when it is submitted', async () => {
  const wrapper = mountDrawer()
  await fill(wrapper, t('host'), 'proxy.example.org')
  await fill(wrapper, t('port'), '3128')
  await fill(wrapper, t('username'), 'admin')
  await fill(wrapper, t('password'), 'secret')

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toEqual([
    [{ host: 'proxy.example.org', port: 3128, username: 'admin', password: 'secret' }],
  ])
})

it('does not confirm when it is submitted while invalid', async () => {
  const wrapper = mountDrawer()

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toBeUndefined()
})
