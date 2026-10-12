import BackupRepositoryFormCheckbox from '@/modules/backup-repository/components/form/inputs/BackupRepositoryFormCheckbox.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount, type VueWrapper } from '@vue/test-utils'

type CheckboxProps = InstanceType<typeof BackupRepositoryFormCheckbox>['$props']

function mountCheckbox(props: Partial<CheckboxProps> = {}) {
  return mount(BackupRepositoryFormCheckbox, {
    props: { label: 'Encrypted', modelValue: false, ...props },
    global: createGlobalTestConfig(),
  })
}

function findWarnings(wrapper: VueWrapper) {
  return wrapper.findAll('.ui-info').map(warning => warning.text())
}

it('shows its label', () => {
  expect(mountCheckbox().get('.checkbox-label').text()).toBe('Encrypted')
})

it('shows no warning when none is given', () => {
  expect(findWarnings(mountCheckbox())).toEqual([])
})

it.each<[string, CheckboxProps['warning']]>([
  ['a text', 'The data cannot be recovered'],
  ['a message', { content: 'The data cannot be recovered', accent: 'warning' }],
])('shows the warning given as %s', (_, warning) => {
  expect(findWarnings(mountCheckbox({ warning }))).toEqual(['The data cannot be recovered'])
})

it('shows every warning when several are given', () => {
  const warning = ['The data cannot be recovered', 'Another warning']

  expect(findWarnings(mountCheckbox({ warning }))).toEqual(warning)
})

it('is checked according to its model', () => {
  const isChecked = (modelValue: boolean) =>
    mountCheckbox({ modelValue }).get<HTMLInputElement>('input[type="checkbox"]').element.checked

  expect({ whenFalse: isChecked(false), whenTrue: isChecked(true) }).toEqual({ whenFalse: false, whenTrue: true })
})

it('updates its model when it is checked', async () => {
  const wrapper = mountCheckbox()

  await wrapper.get('input[type="checkbox"]').setValue(true)

  expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
})

it('cannot be checked when it is disabled', () => {
  const wrapper = mountCheckbox({ disabled: true })

  expect(wrapper.get('input[type="checkbox"]').attributes()).toHaveProperty('disabled')
})
