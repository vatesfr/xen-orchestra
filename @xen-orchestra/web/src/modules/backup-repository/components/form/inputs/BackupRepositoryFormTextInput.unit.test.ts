import BackupRepositoryFormTextInput from '@/modules/backup-repository/components/form/inputs/BackupRepositoryFormTextInput.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount, type VueWrapper } from '@vue/test-utils'

type TextInputProps = InstanceType<typeof BackupRepositoryFormTextInput>['$props']

function mountTextInput(props: Partial<TextInputProps> = {}) {
  return mount(BackupRepositoryFormTextInput, {
    props: { label: 'Host', modelValue: '', ...props },
    global: createGlobalTestConfig(),
  })
}

function findMessages(wrapper: VueWrapper) {
  return wrapper.findAll('.ui-info').map(message => message.text())
}

it('shows its label', () => {
  expect(mountTextInput().get('.ui-label').text()).toContain('Host')
})

it('shows no message without info nor error', () => {
  expect(findMessages(mountTextInput())).toEqual([])
})

it('shows the info as its message', () => {
  const wrapper = mountTextInput({ info: 'Example: 192.168.1.10' })

  expect(findMessages(wrapper)).toEqual(['Example: 192.168.1.10'])
})

it('shows the error instead of the info', () => {
  const wrapper = mountTextInput({
    info: 'Example: 192.168.1.10',
    error: { content: 'This field is required', accent: 'danger' },
  })

  expect(findMessages(wrapper)).toEqual(['This field is required'])
})

it('shows the prefix ahead of the value', () => {
  expect(mountTextInput({ prefix: '\\\\' }).get('.prefix').text()).toBe('\\\\')
})

it('updates its model with the trimmed value', async () => {
  const wrapper = mountTextInput()

  await wrapper.get('input').setValue('  192.168.1.10  ')

  expect(wrapper.emitted('update:modelValue')).toEqual([['192.168.1.10']])
})

it('reports that the input lost the focus', async () => {
  const wrapper = mountTextInput()

  await wrapper.get('input').trigger('blur')

  expect(wrapper.emitted('blur')).toHaveLength(1)
})
