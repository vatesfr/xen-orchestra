import BackupJobFormEmailInput from '@/modules/backup-job/components/form/inputs/BackupJobFormEmailInput.vue'
import { getButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount, type VueWrapper } from '@vue/test-utils'

function mountEmailInput(modelValue: string[] = []) {
  return mount(BackupJobFormEmailInput, {
    props: { label: 'Report recipients', modelValue },
    global: createGlobalTestConfig(),
  })
}

function findMessages(wrapper: VueWrapper) {
  return wrapper.findAll('.ui-info').map(message => message.text())
}

async function addEmail(wrapper: VueWrapper, email: string) {
  await wrapper.get('input').setValue(email)
  await getButton(wrapper, t('action:add')).trigger('click')
}

it('shows the recipients as chips', () => {
  const wrapper = mountEmailInput(['admin@example.com', 'ops@example.com'])

  expect(wrapper.findAll('.ui-chip').map(chip => chip.text())).toEqual(['admin@example.com', 'ops@example.com'])
})

it('adds the typed email address to the recipients', async () => {
  const wrapper = mountEmailInput(['admin@example.com'])

  await addEmail(wrapper, '  ops@example.com ')

  expect(wrapper.emitted('update:modelValue')).toEqual([[['admin@example.com', 'ops@example.com']]])
})

it('adds the typed email address with the Enter key', async () => {
  const wrapper = mountEmailInput()

  await wrapper.get('input').setValue('ops@example.com')
  await wrapper.get('input').trigger('keydown', { key: 'Enter' })

  expect(wrapper.emitted('update:modelValue')).toEqual([[['ops@example.com']]])
})

it('clears the field once the email address is added', async () => {
  const wrapper = mountEmailInput()

  await addEmail(wrapper, 'ops@example.com')

  expect(wrapper.get<HTMLInputElement>('input').element.value).toBe('')
})

it.each([
  ['an empty', '', 'email-mandatory'],
  ['an invalid', 'not-an-email', 'invalid-email'],
  ['an already added', 'admin@example.com', 'email-already-added'],
])('rejects %s email address', async (_, email, errorKey) => {
  const wrapper = mountEmailInput(['admin@example.com'])

  await addEmail(wrapper, email)

  expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  expect(findMessages(wrapper)).toEqual([t(errorKey)])
})

it('clears the error once a valid email address is added', async () => {
  const wrapper = mountEmailInput()
  await addEmail(wrapper, 'not-an-email')

  await addEmail(wrapper, 'ops@example.com')

  expect(findMessages(wrapper)).toEqual([])
})

it('removes a recipient', async () => {
  const wrapper = mountEmailInput(['admin@example.com', 'ops@example.com'])

  await wrapper.findAll('.ui-chip')[0].get('button').trigger('click')

  expect(wrapper.emitted('update:modelValue')).toEqual([[['ops@example.com']]])
})
