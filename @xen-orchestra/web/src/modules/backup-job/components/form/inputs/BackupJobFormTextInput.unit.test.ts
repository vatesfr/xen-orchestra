import BackupJobFormTextInput from '@/modules/backup-job/components/form/inputs/BackupJobFormTextInput.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount, type VueWrapper } from '@vue/test-utils'

type TextInputProps = InstanceType<typeof BackupJobFormTextInput>['$props']

function mountTextInput(props: Partial<TextInputProps> = {}) {
  return mount(BackupJobFormTextInput, {
    props: { label: 'Name', modelValue: '', ...props },
    global: createGlobalTestConfig(),
  })
}

function findMessages(wrapper: VueWrapper) {
  return wrapper.findAll('.ui-info').map(message => message.text())
}

it('shows its label', () => {
  expect(mountTextInput().get('.ui-label').text()).toContain('Name')
})

it('shows no message without warning nor error', () => {
  expect(findMessages(mountTextInput())).toEqual([])
})

it('shows the error', () => {
  const wrapper = mountTextInput({ error: { content: 'Name is required.', accent: 'danger' } })

  expect(findMessages(wrapper)).toEqual(['Name is required.'])
})

it('shows the warning along with the error', () => {
  const wrapper = mountTextInput({
    warning: { content: 'This name is already used', accent: 'warning' },
    error: { content: 'Name is required.', accent: 'danger' },
  })

  expect(findMessages(wrapper)).toEqual(expect.arrayContaining(['This name is already used', 'Name is required.']))
})

it('updates its model with the typed value', async () => {
  const wrapper = mountTextInput()

  await wrapper.get('input').setValue('Daily backup')

  expect(wrapper.emitted('update:modelValue')).toEqual([['Daily backup']])
})

it('reports that the input lost the focus', async () => {
  const wrapper = mountTextInput()

  await wrapper.get('input').trigger('blur')

  expect(wrapper.emitted('blur')).toHaveLength(1)
})
