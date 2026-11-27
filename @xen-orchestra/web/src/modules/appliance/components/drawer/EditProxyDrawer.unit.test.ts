import EditProxyDrawer from '@/modules/appliance/components/drawer/EditProxyDrawer.vue'
import type { XoaProxy } from '@/modules/appliance/types/xoa-proxy.type.ts'
import { cancelDrawer, findDrawerButtonLabels, submitDrawer } from '@/test/drawer.ts'
import { getInputWrapper } from '@/test/find-input-labels.ts'
import { getButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount, type VueWrapper } from '@vue/test-utils'

const PROXY: XoaProxy = { host: 'proxy.example.org', port: 3128, username: 'admin' }

function mountDrawer() {
  return mount(EditProxyDrawer, { props: { proxy: PROXY }, global: createGlobalTestConfig(), attachTo: document.body })
}

function getInput(wrapper: VueWrapper, label: string) {
  return getInputWrapper(wrapper, label).get<HTMLInputElement>('input')
}

it('shows its title', () => {
  expect(mountDrawer().get('.ui-drawer .header').text()).toBe(t('action:edit-proxy'))
})

it('fills the fields from the proxy, without its password', () => {
  const wrapper = mountDrawer()

  expect(getInput(wrapper, t('host')).element.value).toBe('proxy.example.org')
  expect(getInput(wrapper, t('port')).element.value).toBe('3128')
  expect(getInput(wrapper, t('username')).element.value).toBe('admin')
  expect(getInput(wrapper, t('password')).element.value).toBe('')
})

it('offers to remove the proxy, to cancel or to save', () => {
  expect(findDrawerButtonLabels(mountDrawer())).toEqual([t('action:remove-proxy'), t('cancel'), t('action:save')])
})

it('asks to remove the proxy from the remove button', async () => {
  const wrapper = mountDrawer()

  await getButton(wrapper, t('action:remove-proxy')).trigger('click')

  expect(wrapper.emitted('remove')).toHaveLength(1)
  expect(wrapper.emitted('confirm')).toBeUndefined()
})

it('cancels from the cancel button', async () => {
  const wrapper = mountDrawer()

  await cancelDrawer(wrapper)

  expect(wrapper.emitted('cancel')).toHaveLength(1)
  expect(wrapper.emitted('confirm')).toBeUndefined()
})

it('confirms with the edited proxy when it is submitted', async () => {
  const wrapper = mountDrawer()
  await getInput(wrapper, t('port')).setValue('8080')

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toEqual([[{ host: 'proxy.example.org', port: 8080, username: 'admin' }]])
})

it('does not confirm when it is submitted while invalid', async () => {
  const wrapper = mountDrawer()
  await getInput(wrapper, t('host')).setValue('')

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toBeUndefined()
})
