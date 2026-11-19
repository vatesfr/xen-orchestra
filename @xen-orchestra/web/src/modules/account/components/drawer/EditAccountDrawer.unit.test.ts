import EditAccountDrawer from '@/modules/account/components/drawer/EditAccountDrawer.vue'
import { createUser } from '@/test/create-user.ts'
import { cancelDrawer, findDrawerButtonLabels, submitDrawer } from '@/test/drawer.ts'
import { findInputLabels } from '@/test/find-input-labels.ts'
import { findInputMessages } from '@/test/find-input-messages.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import type { XoUser } from '@vates/types'
import { mount, type VueWrapper } from '@vue/test-utils'

const USER = createUser({ username: 'jdoe', firstname: 'Jane', lastname: 'Doe', email: 'jane.doe@example.org' })

function mountDrawer(user: XoUser = USER) {
  return mount(EditAccountDrawer, {
    props: { user },
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

it('titles the drawer with the edition of the account', () => {
  expect(mountDrawer().get('.ui-drawer .header').text()).toBe(t('action:edit-account'))
})

it('offers the username, the names and the email address', () => {
  expect(findInputLabels(mountDrawer())).toEqual([t('username'), t('first-name'), t('last-name'), t('email-address')])
})

it('fills the fields from the user', () => {
  const wrapper = mountDrawer()

  expect(getField(wrapper, t('username')).get('input').element.value).toBe('jdoe')
  expect(getField(wrapper, t('first-name')).get('input').element.value).toBe('Jane')
  expect(getField(wrapper, t('last-name')).get('input').element.value).toBe('Doe')
  expect(getField(wrapper, t('email-address')).get('input').element.value).toBe('jane.doe@example.org')
})

it('fills the username with the name of a user without username', () => {
  const wrapper = mountDrawer(createUser({ username: undefined, name: 'Jane Doe' }))

  expect(getField(wrapper, t('username')).get('input').element.value).toBe('Jane Doe')
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

it('confirms with the edited fields when it is submitted', async () => {
  const wrapper = mountDrawer()
  await fill(wrapper, t('username'), 'jane')
  await fill(wrapper, t('first-name'), 'Janet')
  await fill(wrapper, t('last-name'), 'Smith')

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toEqual([[{ username: 'jane', firstname: 'Janet', lastname: 'Smith' }]])
})

it('confirms with the new email address when it changed', async () => {
  const wrapper = mountDrawer()
  await fill(wrapper, t('email-address'), 'jane@example.org')

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toEqual([
    [{ username: 'jdoe', firstname: 'Jane', lastname: 'Doe', email: 'jane@example.org' }],
  ])
})

it('does not confirm when it is submitted without username', async () => {
  const wrapper = mountDrawer()
  await fill(wrapper, t('username'), '')

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toBeUndefined()
  expect(findInputMessages(wrapper)).toEqual([t('username-required')])
})
