import RegisterApplianceDrawer from '@/modules/appliance/components/drawer/RegisterApplianceDrawer.vue'
import { cancelDrawer, findDrawerButtonLabels, submitDrawer } from '@/test/drawer.ts'
import { getInputWrapper } from '@/test/find-input-labels.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import { mount, type VueWrapper } from '@vue/test-utils'

function mountDrawer(wrongCredentials = false) {
  return mount(RegisterApplianceDrawer, {
    props: { wrongCredentials },
    global: createGlobalTestConfig(),
    attachTo: document.body,
  })
}

async function fill(wrapper: VueWrapper, label: string, value: string) {
  await getInputWrapper(wrapper, label).get('input').setValue(value)
}

function findAlertAccents(wrapper: VueWrapper) {
  return wrapper.findAllComponents(UiAlert).map(alert => alert.props('accent'))
}

it('shows its title', () => {
  expect(mountDrawer().get('.ui-drawer .header').text()).toBe(t('action:register-appliance'))
})

it('tells why registering is needed', () => {
  expect(findAlertAccents(mountDrawer())).toEqual(['info'])
})

it('warns about wrong credentials, when told so', () => {
  const wrapper = mountDrawer(true)

  expect(findAlertAccents(wrapper)).toEqual(['danger', 'info'])
  expect(wrapper.getComponent(UiAlert).text()).toContain(t('appliance:registration-wrong-credentials'))
})

it('offers to cancel or to register', () => {
  expect(findDrawerButtonLabels(mountDrawer())).toEqual([t('cancel'), t('action:register')])
})

it('cancels from the cancel button', async () => {
  const wrapper = mountDrawer()

  await cancelDrawer(wrapper)

  expect(wrapper.emitted('cancel')).toHaveLength(1)
  expect(wrapper.emitted('confirm')).toBeUndefined()
})

it('confirms with the credentials when it is submitted', async () => {
  const wrapper = mountDrawer()
  await fill(wrapper, t('email'), 'admin@example.org')
  await fill(wrapper, t('password'), 'secret')

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toEqual([[{ email: 'admin@example.org', password: 'secret' }]])
})

it('does not confirm when it is submitted while invalid', async () => {
  const wrapper = mountDrawer()
  await fill(wrapper, t('email'), 'not-an-email')
  await fill(wrapper, t('password'), 'secret')

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toBeUndefined()
})
