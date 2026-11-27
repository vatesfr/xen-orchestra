import EditUpdateSettingsDrawer from '@/modules/appliance/components/drawer/EditUpdateSettingsDrawer.vue'
import { cancelDrawer, findDrawerButtonLabels, submitDrawer } from '@/test/drawer.ts'
import { findInputLabels, getInputWrapper } from '@/test/find-input-labels.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount, type VueWrapper } from '@vue/test-utils'

function mountDrawer(props: { channel?: string; dailyCheck?: boolean } = {}) {
  return mount(EditUpdateSettingsDrawer, {
    props: { channel: 'stable', dailyCheck: false, ...props },
    global: createGlobalTestConfig(),
    attachTo: document.body,
  })
}

// The channel radios, in the order the form lists them: latest, stable, custom
async function chooseChannel(wrapper: VueWrapper, index: number) {
  await wrapper.findAll('input[type="radio"]')[index].setValue(true)
}

const CUSTOM_CHANNEL = 2

it('shows its title', () => {
  expect(mountDrawer().get('.ui-drawer .header').text()).toBe(t('action:edit-update-settings'))
})

it('offers to cancel or to save', () => {
  expect(findDrawerButtonLabels(mountDrawer())).toEqual([t('cancel'), t('action:save')])
})

it('cancels from the cancel button', async () => {
  const wrapper = mountDrawer()

  await cancelDrawer(wrapper)

  expect(wrapper.emitted('cancel')).toHaveLength(1)
  expect(wrapper.emitted('confirm')).toBeUndefined()
})

it('confirms with the current settings when submitted unchanged', async () => {
  const wrapper = mountDrawer({ dailyCheck: true })

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toEqual([[{ channel: 'stable', dailyCheck: true }]])
})

it('asks the name of a custom channel only once chosen', async () => {
  const wrapper = mountDrawer()

  expect(findInputLabels(wrapper)).not.toContain(t('appliance:channel-name'))

  await chooseChannel(wrapper, CUSTOM_CHANNEL)

  expect(findInputLabels(wrapper)).toContain(t('appliance:channel-name'))
})

it('confirms with the name of the custom channel', async () => {
  const wrapper = mountDrawer()
  await chooseChannel(wrapper, CUSTOM_CHANNEL)
  await getInputWrapper(wrapper, t('appliance:channel-name')).get('input').setValue('beta-2026')

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toEqual([[{ channel: 'beta-2026', dailyCheck: false }]])
})

it('does not confirm a custom channel without name', async () => {
  const wrapper = mountDrawer()
  await chooseChannel(wrapper, CUSTOM_CHANNEL)

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toBeUndefined()
})

it('does not confirm without channel', async () => {
  const wrapper = mountDrawer({ channel: undefined })

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toBeUndefined()
})
