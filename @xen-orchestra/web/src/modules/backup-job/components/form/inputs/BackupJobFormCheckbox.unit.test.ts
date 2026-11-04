import BackupJobFormCheckbox from '@/modules/backup-job/components/form/inputs/BackupJobFormCheckbox.vue'
import { getCheckbox } from '@/test/get-checkbox.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount, type VueWrapper } from '@vue/test-utils'

type CheckboxProps = InstanceType<typeof BackupJobFormCheckbox>['$props']

function mountCheckbox(props: Partial<CheckboxProps> = {}) {
  return mount(BackupJobFormCheckbox, {
    props: { label: 'Offline backup', modelValue: false, ...props },
    global: createGlobalTestConfig(),
  })
}

function findMessages(wrapper: VueWrapper) {
  return wrapper.findAll('.ui-info').map(message => message.text())
}

it('shows its label', () => {
  expect(getCheckbox(mountCheckbox(), 'Offline backup').exists()).toBe(true)
})

it('shows no message without info nor error', () => {
  expect(findMessages(mountCheckbox())).toEqual([])
})

it('shows the info, then the error', () => {
  const wrapper = mountCheckbox({
    info: 'The VMs will be shut down',
    error: { content: 'Select at least one option', accent: 'danger' },
  })

  expect(findMessages(wrapper)).toEqual(['The VMs will be shut down', 'Select at least one option'])
})

it('is checked according to its model', () => {
  const isChecked = (modelValue: boolean) =>
    getCheckbox(mountCheckbox({ modelValue }), 'Offline backup').element.checked

  expect({ whenFalse: isChecked(false), whenTrue: isChecked(true) }).toEqual({ whenFalse: false, whenTrue: true })
})

it('updates its model when it is checked', async () => {
  const wrapper = mountCheckbox()

  await getCheckbox(wrapper, 'Offline backup').setValue(true)

  expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
})
