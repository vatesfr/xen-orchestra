import NewSshKeyDrawer from '@/modules/account/components/drawer/NewSshKeyDrawer.vue'
import type { SshKey } from '@/modules/account/types/ssh-key.type.ts'
import { cancelDrawer, findDrawerButtonLabels, submitDrawer } from '@/test/drawer.ts'
import { findInputLabels } from '@/test/find-input-labels.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount, type VueWrapper } from '@vue/test-utils'

function mountDrawer(existingSshKeys: SshKey[] = []) {
  return mount(NewSshKeyDrawer, {
    props: { existingSshKeys },
    global: createGlobalTestConfig(),
  })
}

function findKeyMessages(wrapper: VueWrapper) {
  return wrapper.findAll('.ui-textarea .ui-info').map(message => message.text())
}

async function fill(wrapper: VueWrapper, title: string, key: string) {
  await wrapper.get('input').setValue(title)
  await wrapper.get('textarea').setValue(key)
}

it('titles the drawer with the creation of an SSH key', () => {
  expect(mountDrawer().get('.ui-drawer .header').text()).toBe(t('action:new-ssh-key'))
})

it('offers a title and a key', () => {
  const wrapper = mountDrawer()

  expect(findInputLabels(wrapper)).toEqual([t('title')])
  expect(wrapper.get('.ui-textarea .ui-label').text()).toContain(t('public-key'))
})

it('explains what to paste in the key field', () => {
  expect(findKeyMessages(mountDrawer())).toEqual([t('ssh-public-key-info')])
})

it('offers to cancel or to create', () => {
  expect(findDrawerButtonLabels(mountDrawer())).toEqual([t('cancel'), t('action:create')])
})

it('cancels from the cancel button', async () => {
  const wrapper = mountDrawer()

  await cancelDrawer(wrapper)

  expect(wrapper.emitted('cancel')).toHaveLength(1)
  expect(wrapper.emitted('confirm')).toBeUndefined()
})

it('confirms with the SSH key when it is submitted', async () => {
  const wrapper = mountDrawer()
  await fill(wrapper, 'Laptop', 'ssh-rsa AAA')

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toEqual([[{ title: 'Laptop', key: 'ssh-rsa AAA' }]])
})

it('does not confirm when it is submitted without key', async () => {
  const wrapper = mountDrawer()
  await fill(wrapper, 'Laptop', '')

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toBeUndefined()
  expect(findKeyMessages(wrapper)).toContain(t('form:error:required'))
})

it('does not confirm a key the user already has', async () => {
  const wrapper = mountDrawer([{ title: 'Laptop', key: 'ssh-rsa AAA' }])
  await fill(wrapper, 'Other title', 'ssh-rsa AAA')

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toBeUndefined()
  expect(findKeyMessages(wrapper)).toContain(t('ssh-key-already-exists'))
})
