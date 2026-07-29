import UiCard from '@core/components/ui/card/UiCard.vue'
import { createGlobalTestConfig } from '@core/test/global-test-config.ts'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-vue'

function renderCard(props = {}) {
  return render(UiCard, {
    props,
    slots: { default: 'Card content' },
    global: createGlobalTestConfig(),
  })
}

test('renders the default slot content', async () => {
  const screen = renderCard()

  await expect.element(screen.getByText('Card content')).toBeVisible()
})

test('applies its design tokens to the rendered card', () => {
  const screen = renderCard()

  const card = screen.container.querySelector('.ui-card') as HTMLElement
  const styles = getComputedStyle(card)

  expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
  expect(styles.padding).not.toBe('0px')
  expect(styles.borderRadius).not.toBe('0px')
})

test('switches to a row layout when horizontal', () => {
  const screen = renderCard({ horizontal: true })

  const card = screen.container.querySelector('.ui-card') as HTMLElement

  expect(getComputedStyle(card).flexDirection).toBe('row')
})
