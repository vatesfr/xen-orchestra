import UiInput from '@core/components/ui/input/UiInput.vue'
import { createGlobalTestConfig } from '@core/test/global-test-config.ts'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-vue'

function renderInput(props = {}) {
  return render(UiInput, {
    props: { accent: 'brand', modelValue: '', ...props },
    global: createGlobalTestConfig(),
  })
}

test('emits the typed value through its model', async () => {
  const screen = renderInput()

  await screen.getByRole('textbox').fill('hello')

  expect(screen.emitted('update:modelValue')?.at(-1)).toEqual(['hello'])
})

test('does not show the clear button when there is no value', () => {
  const screen = renderInput({ clearable: true })

  expect(screen.container.querySelector('.ui-button-icon')).toBeNull()
})

test('clears the value and emits "clear" when the clear button is clicked', async () => {
  const screen = renderInput({ modelValue: 'hello', clearable: true })

  await screen.getByRole('button').click()

  expect(screen.emitted('update:modelValue')?.at(-1)).toEqual([''])
  expect(screen.emitted('clear')).toBeTruthy()
})

test('applies its design tokens to the rendered input', () => {
  const screen = renderInput()

  const input = screen.container.querySelector('.ui-input') as HTMLElement
  const styles = getComputedStyle(input)

  expect(styles.borderRadius).not.toBe('0px')
  expect(styles.borderStyle).toBe('solid')
})
