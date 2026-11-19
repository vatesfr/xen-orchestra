import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'
import { defineComponent, type VNodeChild } from 'vue'

// A select only renders below the component that defines it: the setup defines it and renders what shows it
export function mountWithSelect(setup: () => () => VNodeChild) {
  return mount(defineComponent({ setup }), { global: createGlobalTestConfig() })
}
