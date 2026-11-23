import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { mount, type VueWrapper } from '@vue/test-utils'
import type { Component } from 'vue'

type FieldComponent = abstract new (...args: any) => { $props: object }

type FieldMountOptions = { slots?: Record<string, string>; attrs?: Record<string, string> }

/**
 * Mounts a text field component with a `neutral` accent and a `'Value'` model, attached to the document so focus
 * events work; `props` override those defaults.
 */
export function mountField<TComponent extends FieldComponent>(
  component: TComponent & Component,
  props: Partial<InstanceType<TComponent>['$props']> = {},
  { slots, attrs }: FieldMountOptions = {}
) {
  const field: Component = component

  const wrapper = mount(field, {
    global: createGlobalTestConfig(),
    props: { accent: 'neutral', modelValue: 'Value', ...props },
    slots,
    attrs,
    attachTo: document.body,
  })

  return wrapper as VueWrapper<InstanceType<TComponent>>
}
