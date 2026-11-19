import AuthenticationTokenDrawer from '@/modules/account/components/drawer/AuthenticationTokenDrawer.vue'
import { createAuthenticationToken } from '@/test/create-authentication-token.ts'
import { cancelDrawer, findDrawerButtonLabels, submitDrawer } from '@/test/drawer.ts'
import { findInputLabels } from '@/test/find-input-labels.ts'
import { findInputMessages } from '@/test/find-input-messages.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import type { XoAuthenticationToken } from '@vates/types'
import { mount } from '@vue/test-utils'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-03-10T10:00:00'))
})

afterEach(() => {
  vi.useRealTimers()
})

function mountDrawer(token?: XoAuthenticationToken) {
  return mount(AuthenticationTokenDrawer, {
    props: { token },
    global: createGlobalTestConfig(),
  })
}

describe('for a new token', () => {
  it('titles the drawer with the creation of a token', () => {
    expect(mountDrawer().get('.ui-drawer .header').text()).toBe(t('action:new-authentication-token'))
  })

  it('offers a description and an expiration date', () => {
    expect(findInputLabels(mountDrawer())).toEqual([t('description'), t('expiration-date')])
  })

  it('explains the expiration date', () => {
    expect(findInputMessages(mountDrawer())).toEqual([t('authentication-token-expiration-info')])
  })

  it('bounds the expiration date between tomorrow and 181 days from today', () => {
    expect(mountDrawer().get('input[type="date"]').attributes()).toMatchObject({
      min: '2026-03-11',
      max: '2026-09-07',
    })
  })

  it('offers to cancel or to create', () => {
    expect(findDrawerButtonLabels(mountDrawer())).toEqual([t('cancel'), t('action:create')])
  })

  it('confirms with the description only when no expiration date is chosen', async () => {
    const wrapper = mountDrawer()
    await wrapper.get('input:not([type="date"])').setValue('CI')

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toEqual([[{ description: 'CI' }]])
  })

  it('confirms with the time left until the end of the chosen day', async () => {
    const wrapper = mountDrawer()
    await wrapper.get('input:not([type="date"])').setValue('CI')
    await wrapper.get('input[type="date"]').setValue('2026-03-12')

    await submitDrawer(wrapper)

    const expiresIn = new Date('2026-03-12T23:59:59').getTime() - new Date('2026-03-10T10:00:00').getTime()

    expect(wrapper.emitted('confirm')).toEqual([[{ description: 'CI', expiresIn }]])
  })
})

describe('for an existing token', () => {
  const token = createAuthenticationToken({ description: 'CI' })

  it('titles the drawer with the edition of a token', () => {
    expect(mountDrawer(token).get('.ui-drawer .header').text()).toBe(t('action:edit-authentication-token'))
  })

  it('offers the description only, filled from the token', () => {
    const wrapper = mountDrawer(token)

    expect(findInputLabels(wrapper)).toEqual([t('description')])
    expect(wrapper.get('input').element.value).toBe('CI')
  })

  it('offers to cancel or to save', () => {
    expect(findDrawerButtonLabels(mountDrawer(token))).toEqual([t('cancel'), t('action:save')])
  })

  it('confirms with the edited description', async () => {
    const wrapper = mountDrawer(token)
    await wrapper.get('input').setValue('Deployment')

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toEqual([[{ description: 'Deployment' }]])
  })
})

it('cancels from the cancel button', async () => {
  const wrapper = mountDrawer()

  await cancelDrawer(wrapper)

  expect(wrapper.emitted('cancel')).toHaveLength(1)
  expect(wrapper.emitted('confirm')).toBeUndefined()
})
