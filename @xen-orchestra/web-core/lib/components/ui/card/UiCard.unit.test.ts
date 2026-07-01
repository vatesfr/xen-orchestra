import UiCard from '@core/components/ui/card/UiCard.vue'
import { createGlobalTestConfig } from '@core/test/global-test-config.ts'
import { mount } from '@vue/test-utils'
import { expect, test } from 'vitest'

function mountCard(props = {}) {
  return mount(UiCard, {
    props,
    slots: { default: 'Card content' },
    global: createGlobalTestConfig(),
  })
}

test('renders the default slot content', () => {
  const wrapper = mountCard()

  expect(wrapper.text()).toContain('Card content')
})

test('is vertical by default', () => {
  const wrapper = mountCard()

  expect(wrapper.classes()).not.toContain('horizontal')
})

test('applies the horizontal modifier when the prop is set', () => {
  const wrapper = mountCard({ horizontal: true })

  expect(wrapper.classes()).toContain('horizontal')
})

test('applies the error modifier when the prop is set', () => {
  const wrapper = mountCard({ hasError: true })

  expect(wrapper.classes()).toContain('has-error')
})
