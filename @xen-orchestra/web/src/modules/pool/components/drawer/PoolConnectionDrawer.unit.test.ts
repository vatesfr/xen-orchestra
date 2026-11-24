import PoolConnectionDrawer from '@/modules/pool/components/drawer/PoolConnectionDrawer.vue'
import { cancelDrawer, submitDrawer } from '@/test/drawer.ts'
import { getInputWrapper } from '@/test/find-input-labels.ts'
import { dangerMessage } from '@/test/form-messages.ts'
import { getCheckbox } from '@/test/get-checkbox.ts'
import { t } from '@/test/i18n.ts'
import { mountWithProps } from '@/test/mount-with-props.ts'
import VtsRequiredHint from '@core/components/required-hint/VtsRequiredHint.vue'
import type { VueWrapper } from '@vue/test-utils'

const CONNECTION = { host: '192.168.1.10', username: 'root', password: 'secret' }

function mountDrawer() {
  return mountWithProps(PoolConnectionDrawer, {})
}

async function setInput(wrapper: VueWrapper, label: string, value: string) {
  await getInputWrapper(wrapper, label).get('input').setValue(value)
}

async function fillDrawer(wrapper: VueWrapper) {
  await setInput(wrapper, t('ip-address'), CONNECTION.host)
  await setInput(wrapper, t('username'), CONNECTION.username)
  await setInput(wrapper, t('password'), CONNECTION.password)
}

function getMessage(wrapper: VueWrapper, label: string) {
  return getInputWrapper(wrapper, label).props('message')
}

it('tells which fields are required', () => {
  expect(mountDrawer().findComponent(VtsRequiredHint).exists()).toBe(true)
})

describe('confirm', () => {
  it('does not confirm an incomplete connection, and tells what is missing', async () => {
    const wrapper = mountDrawer()

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(getMessage(wrapper, t('ip-address'))).toContainEqual(dangerMessage(t('ip-address-required')))
    expect(getMessage(wrapper, t('username'))).toContainEqual(dangerMessage(t('username-required')))
    expect(getMessage(wrapper, t('password'))).toEqual(dangerMessage(t('password-required')))
  })

  it('confirms with the connection to the pool master', async () => {
    const wrapper = mountDrawer()
    await fillDrawer(wrapper)

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toEqual([
      [{ ...CONNECTION, httpProxy: undefined, readOnly: false, allowUnauthorized: false }],
    ])
  })

  it('confirms with the proxy and the options checked', async () => {
    const wrapper = mountDrawer()
    await fillDrawer(wrapper)
    await setInput(wrapper, t('proxy-url'), 'http://proxy.local:3128')
    await getCheckbox(wrapper, t('read-only')).setValue(true)
    await getCheckbox(wrapper, t('accept-self-signed-certificates')).setValue(true)

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toEqual([
      [{ ...CONNECTION, httpProxy: 'http://proxy.local:3128', readOnly: true, allowUnauthorized: true }],
    ])
  })
})

it('cancels from the cancel button', async () => {
  const wrapper = mountDrawer()

  await cancelDrawer(wrapper)

  expect(wrapper.emitted('cancel')).toHaveLength(1)
})
