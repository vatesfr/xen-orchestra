import EditPasswordDrawer from '@/modules/account/components/drawer/EditPasswordDrawer.vue'
import { cancelDrawer, findDrawerButtonLabels, submitDrawer } from '@/test/drawer.ts'
import { findInputLabels } from '@/test/find-input-labels.ts'
import { findInputMessages } from '@/test/find-input-messages.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount, type VueWrapper } from '@vue/test-utils'

function mountDrawer() {
  return mount(EditPasswordDrawer, {
    global: createGlobalTestConfig(),
  })
}

function getField(wrapper: VueWrapper, label: string) {
  const field = wrapper.findAll('.vts-input-wrapper').find(field => field.get('.ui-label').text().includes(label))

  if (field === undefined) {
    throw new Error(`No field labelled "${label}"`)
  }

  return field
}

async function fill(wrapper: VueWrapper, label: string, value: string) {
  await getField(wrapper, label).get('input').setValue(value)
}

async function fillPasswords(wrapper: VueWrapper, oldPassword: string, newPassword: string, confirmation: string) {
  await fill(wrapper, t('old-password'), oldPassword)
  await fill(wrapper, t('new-password'), newPassword)
  await fill(wrapper, t('confirm-new-password'), confirmation)
}

it('titles the drawer with the edition of the password', () => {
  expect(mountDrawer().get('.ui-drawer .header').text()).toBe(t('action:edit-password'))
})

it('offers the old password, the new one and its confirmation as password inputs', () => {
  const wrapper = mountDrawer()

  expect(findInputLabels(wrapper)).toEqual([t('old-password'), t('new-password'), t('confirm-new-password')])
  expect(wrapper.findAll('input').map(input => input.attributes('type'))).toEqual(['password', 'password', 'password'])
})

it('warns that changing the password signs the user out of the other sessions', () => {
  expect(findInputMessages(mountDrawer())).toContain(t('password-change-sign-out-info'))
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

it('confirms with the old and the new password when it is submitted', async () => {
  const wrapper = mountDrawer()
  await fillPasswords(wrapper, 'old-secret', 'new-secret', 'new-secret')

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toEqual([[{ oldPassword: 'old-secret', newPassword: 'new-secret' }]])
})

it('does not confirm when it is submitted empty', async () => {
  const wrapper = mountDrawer()

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toBeUndefined()
})

it('does not confirm when the confirmation differs from the new password', async () => {
  const wrapper = mountDrawer()
  await fillPasswords(wrapper, 'old-secret', 'new-secret', 'other-secret')

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toBeUndefined()
  expect(findInputMessages(wrapper)).toContain(t('password-confirmation-different'))
})
