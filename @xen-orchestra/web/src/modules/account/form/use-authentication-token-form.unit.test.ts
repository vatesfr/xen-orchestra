import { useAuthenticationTokenForm } from '@/modules/account/form/use-authentication-token-form.ts'
import { createAuthenticationToken } from '@/test/create-authentication-token.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { XoAuthenticationToken } from '@vates/types'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-03-10T10:00:00'))
})

afterEach(() => {
  vi.useRealTimers()
})

function mountTokenForm(token?: XoAuthenticationToken) {
  return mountComposable(() => useAuthenticationTokenForm(token)).wrapper.vm
}

describe('formData', () => {
  it('starts empty for a new token', () => {
    expect(mountTokenForm().formData).toEqual({ description: '', expirationDate: '' })
  })

  it('starts with the description of the edited token', () => {
    const form = mountTokenForm(createAuthenticationToken({ description: 'CI' }))

    expect(form.formData.description).toBe('CI')
  })
})

describe('minExpirationDate', () => {
  it('is tomorrow', () => {
    expect(mountTokenForm().minExpirationDate).toBe('2026-03-11')
  })
})

describe('maxExpirationDate', () => {
  it('is 181 days from today', () => {
    expect(mountTokenForm().maxExpirationDate).toBe('2026-09-07')
  })
})

describe('buildPayload', () => {
  it('has no expiration when no date is chosen', () => {
    const form = mountTokenForm()
    form.formData.description = 'CI'

    expect(form.buildPayload()).toEqual({ description: 'CI' })
  })

  it('expires at the end of the chosen day', () => {
    const form = mountTokenForm()
    form.formData.description = 'CI'
    form.formData.expirationDate = '2026-03-12'

    const expectedExpiresIn = new Date('2026-03-12T23:59:59').getTime() - new Date('2026-03-10T10:00:00').getTime()

    expect(form.buildPayload()).toEqual({ description: 'CI', expiresIn: expectedExpiresIn })
  })
})
