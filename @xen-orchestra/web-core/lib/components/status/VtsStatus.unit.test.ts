import VtsStatus from '@core/components/status/VtsStatus.vue'
import type { Status } from '@core/components/status/VtsStatus.vue'
import { createGlobalTestConfig } from '@core/test/global-test-config.ts'
import { mount } from '@vue/test-utils'
import { expect, test } from 'vitest'

function mountStatus(status: Status, iconOnly = false) {
  return mount(VtsStatus, {
    props: { status, iconOnly },
    global: createGlobalTestConfig(),
  })
}

test('maps the boolean "true" status to the enabled label', () => {
  const wrapper = mountStatus(true)

  expect(wrapper.text()).toBe('Enabled')
})

test('maps the boolean "false" status to the disabled label', () => {
  const wrapper = mountStatus(false)

  expect(wrapper.text()).toBe('Disabled')
})

test('maps a named status to its translated label', () => {
  const wrapper = mountStatus('success')

  expect(wrapper.text()).toBe('Success')
})

test('hides the label in icon-only mode', () => {
  const wrapper = mountStatus('failure', true)

  expect(wrapper.text()).toBe('')
})
