import type { VueWrapper } from '@vue/test-utils'

// A stubbed `FormSelect` renders its bindings as attributes
export function findSelectStubLabels(wrapper: VueWrapper) {
  return wrapper.findAll('form-select-stub').map(select => select.attributes('label'))
}
