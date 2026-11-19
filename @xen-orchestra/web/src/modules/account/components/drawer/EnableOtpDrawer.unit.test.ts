import EnableOtpDrawer from '@/modules/account/components/drawer/EnableOtpDrawer.vue'
import { createUser } from '@/test/create-user.ts'
import { cancelDrawer, findDrawerButtonLabels, submitDrawer } from '@/test/drawer.ts'
import { findInputLabels } from '@/test/find-input-labels.ts'
import { findInputMessages } from '@/test/find-input-messages.ts'
import { findTitles } from '@/test/find-titles.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { flushPromises, mount } from '@vue/test-utils'
import { generate, generateURI } from 'otplib'
import { toDataURL } from 'qrcode'

const user = createUser()

async function mountDrawer({ settled = true } = {}) {
  const wrapper = mount(EnableOtpDrawer, {
    props: { user },
    global: createGlobalTestConfig(),
  })

  if (settled) {
    await flushPromises()
  }

  return wrapper
}

function getSecret(wrapper: Awaited<ReturnType<typeof mountDrawer>>) {
  return wrapper.getComponent(UiTag).text()
}

async function fillCode(wrapper: Awaited<ReturnType<typeof mountDrawer>>, code: string) {
  await wrapper.get('input').setValue(code)
}

it('titles the drawer with the activation of the OTP authentication', async () => {
  const wrapper = await mountDrawer()

  expect(wrapper.get('.ui-drawer .header').text()).toBe(t('action:enable-otp-authentication'))
})

it('has a section to scan the QR code and one to enter the verification code', async () => {
  const wrapper = await mountDrawer()

  expect(findTitles(wrapper)).toEqual([t('otp-scan-qr-code'), t('otp-enter-verification-code')])
})

it('shows the QR code of the secret', async () => {
  const wrapper = await mountDrawer()
  const expected = await toDataURL(generateURI({ issuer: 'Xen Orchestra', label: user.email, secret: getSecret(wrapper) }))

  expect(wrapper.get('img').attributes()).toMatchObject({ src: expected, alt: t('otp-qr-code-alt') })
})

it('shows no QR code until it is generated', async () => {
  const wrapper = await mountDrawer({ settled: false })

  expect(wrapper.find('img').exists()).toBe(false)
})

it('shows the secret to enter manually, with a button to copy it', async () => {
  const wrapper = await mountDrawer()

  expect(getSecret(wrapper)).not.toBe('')
  expect(wrapper.getComponent(VtsCopyButton).props('value')).toBe(getSecret(wrapper))
  expect(findInputMessages(wrapper)).toContain(t('otp-secret-manual'))
})

it('asks for the verification code', async () => {
  const wrapper = await mountDrawer()

  expect(findInputLabels(wrapper)).toEqual([t('verification-code')])
})

it('offers to cancel or to enable', async () => {
  const wrapper = await mountDrawer()

  expect(findDrawerButtonLabels(wrapper)).toEqual([t('cancel'), t('action:enable')])
})

it('cancels from the cancel button', async () => {
  const wrapper = await mountDrawer()

  await cancelDrawer(wrapper)

  expect(wrapper.emitted('cancel')).toHaveLength(1)
  expect(wrapper.emitted('confirm')).toBeUndefined()
})

it('confirms with the secret when the code is valid', async () => {
  const wrapper = await mountDrawer()
  const secret = getSecret(wrapper)
  await fillCode(wrapper, await generate({ secret }))

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toEqual([[secret]])
})

it('does not confirm when the code is invalid', async () => {
  const wrapper = await mountDrawer()
  await fillCode(wrapper, await generate({ secret: getSecret(wrapper), epoch: Date.now() / 1000 - 120 }))

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toBeUndefined()
  expect(findInputMessages(wrapper)).toContain(t('invalid-code'))
})

it('does not confirm when no code is entered', async () => {
  const wrapper = await mountDrawer()

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toBeUndefined()
  expect(findInputMessages(wrapper)).toContain(t('form:error:required'))
})
