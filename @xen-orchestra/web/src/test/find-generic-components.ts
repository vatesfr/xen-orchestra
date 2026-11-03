import type { VueWrapper } from '@vue/test-utils'

// Found by its definition, a generic component is typed as a plain element: its name keeps its props and its emits
export function getGenericComponent(wrapper: Pick<VueWrapper, 'getComponent'>, name: string) {
  return wrapper.getComponent({ name })
}

export function findAllGenericComponents(wrapper: Pick<VueWrapper, 'findAllComponents'>, name: string) {
  return wrapper.findAllComponents({ name })
}
