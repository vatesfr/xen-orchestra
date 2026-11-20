import FormPasswordInput from '@/shared/components/form/FormPasswordInput.vue'
import { findInputLabels } from '@/test/find-input-labels.ts'
import { findInputMessages } from '@/test/find-input-messages.ts'
import { invalidCredentialsMessage } from '@/test/form-messages.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { blurField, setFieldValue } from '@core-test/field-events.ts'
import { readForwardedFlag } from '@core-test/read-forwarded-flag.ts'
import { mount } from '@vue/test-utils'

type PasswordInputProps = InstanceType<typeof FormPasswordInput>['$props']

function mountPasswordInput(props: Partial<PasswordInputProps> = {}) {
  return mount(FormPasswordInput, {
    props: { label: 'Password', modelValue: 'secret', ...props },
    global: createGlobalTestConfig(),
  })
}

it('renders its label', () => {
  expect(findInputLabels(mountPasswordInput())).toEqual(['Password'])
})

it('hides the typed password', () => {
  expect(mountPasswordInput().getComponent(UiInput).props('type')).toBe('password')
})

it('marks the input as required when asked to', () => {
  expect(readForwardedFlag(mountPasswordInput, UiInput, 'required')).toEqual([true, false])
})

it('keeps the password untrimmed', async () => {
  expect(await setFieldValue(mountPasswordInput(), 'input', ' secret ')).toEqual([[' secret ']])
})

it('shows no message without error', () => {
  expect(findInputMessages(mountPasswordInput())).toEqual([])
})

it('shows its error', () => {
  expect(findInputMessages(mountPasswordInput({ error: invalidCredentialsMessage() }))).toEqual([
    invalidCredentialsMessage().content,
  ])
})

it('emits blur when the input loses focus', async () => {
  expect(await blurField(mountPasswordInput(), 'input')).toHaveLength(1)
})
