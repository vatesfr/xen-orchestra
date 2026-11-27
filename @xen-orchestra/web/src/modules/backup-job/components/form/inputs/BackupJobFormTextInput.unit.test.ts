import BackupJobFormTextInput from '@/modules/backup-job/components/form/inputs/BackupJobFormTextInput.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { blurField, setFieldValue } from '@core-test/field-events.ts'
import { findInfoLabels } from '@core-test/find-accented-labels.ts'
import { mount } from '@vue/test-utils'

type TextInputProps = InstanceType<typeof BackupJobFormTextInput>['$props']

function mountTextInput(props: Partial<TextInputProps> = {}) {
  return mount(BackupJobFormTextInput, {
    props: { label: 'Name', modelValue: '', ...props },
    global: createGlobalTestConfig(),
  })
}

it('shows its label', () => {
  expect(mountTextInput().get('.ui-label').text()).toContain('Name')
})

it('shows no message without warning nor error', () => {
  expect(findInfoLabels(mountTextInput())).toEqual([])
})

it('shows the error', () => {
  const wrapper = mountTextInput({ error: { content: 'Name is required.', accent: 'danger' } })

  expect(findInfoLabels(wrapper)).toEqual(['Name is required.'])
})

it('shows the warning along with the error', () => {
  const wrapper = mountTextInput({
    warning: { content: 'This name is already used', accent: 'warning' },
    error: { content: 'Name is required.', accent: 'danger' },
  })

  expect(findInfoLabels(wrapper)).toEqual(expect.arrayContaining(['This name is already used', 'Name is required.']))
})

it('updates its model with the typed value', async () => {
  expect(await setFieldValue(mountTextInput(), 'input', 'Daily backup')).toEqual([['Daily backup']])
})

it('reports that the input lost the focus', async () => {
  expect(await blurField(mountTextInput(), 'input')).toHaveLength(1)
})
