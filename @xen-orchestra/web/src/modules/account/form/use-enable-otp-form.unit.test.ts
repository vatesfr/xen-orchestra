import { useEnableOtpForm } from '@/modules/account/form/use-enable-otp-form.ts'
import { createUser } from '@/test/create-user.ts'
import { dangerMessage, requiredMessage } from '@/test/form-messages.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { NOW } from '@/test/now.ts'
import { generate, generateURI } from 'otplib'
import { toDataURL } from 'qrcode'

const PERIOD = 30

beforeEach(() => {
  vi.useFakeTimers({ now: NOW, toFake: ['Date'] })
})

const user = createUser({ email: 'jane@example.org' })

function mountEnableOtpForm() {
  return mountComposableWithI18n(() => useEnableOtpForm(user))
}

function getCodeAt(form: ReturnType<typeof mountEnableOtpForm>, epoch: number) {
  return generate({ secret: form.secret, epoch })
}

describe('secret', () => {
  it('is a different secret for each form', () => {
    expect(mountEnableOtpForm().secret).not.toBe(mountEnableOtpForm().secret)
  })
})

describe('qrCodeUrl', () => {
  it('is the QR code of the URI of the user and the secret', async () => {
    const form = mountEnableOtpForm()
    const uri = generateURI({ issuer: 'Xen Orchestra', label: 'jane@example.org', secret: form.secret })
    const expected = await toDataURL(uri)

    await vi.waitFor(() => expect(form.qrCodeUrl).toBe(expected))
  })
})

describe('validateAndGetSecret', () => {
  it('returns the secret when the code is valid', async () => {
    const form = mountEnableOtpForm()
    form.codeInputBindings['onUpdate:modelValue'](await getCodeAt(form, NOW / 1000))

    expect(await form.validateAndGetSecret()).toBe(form.secret)
  })

  it('accepts the code of the previous period', async () => {
    const form = mountEnableOtpForm()
    form.codeInputBindings['onUpdate:modelValue'](await getCodeAt(form, NOW / 1000 - PERIOD))

    expect(await form.validateAndGetSecret()).toBe(form.secret)
  })

  it('rejects the code of two periods ago', async () => {
    const form = mountEnableOtpForm()
    form.codeInputBindings['onUpdate:modelValue'](await getCodeAt(form, NOW / 1000 - 2 * PERIOD))

    expect(await form.validateAndGetSecret()).toBeUndefined()
    expect(form.codeInputBindings.error).toEqual(dangerMessage(form.t('invalid-code')))
  })

  it('rejects an empty code', async () => {
    const form = mountEnableOtpForm()

    expect(await form.validateAndGetSecret()).toBeUndefined()
    expect(form.codeInputBindings.error).toEqual(requiredMessage())
  })

  it('rejects a code that is not a number', async () => {
    const form = mountEnableOtpForm()
    form.codeInputBindings['onUpdate:modelValue']('abc')

    expect(await form.validateAndGetSecret()).toBeUndefined()
    expect(form.codeInputBindings.error).toEqual(dangerMessage(form.t('invalid-code')))
  })
})
