import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'
import type { Component } from 'vue'

/** Mounts `component` on `props` with the global test config, for a shared helper taking any component. */
export function mountWithProps(component: Component, props: Record<string, unknown>) {
  return mount(component, { props, global: createGlobalTestConfig() })
}
