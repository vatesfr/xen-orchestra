import type { VueWrapper } from '@vue/test-utils'
import type { Component } from 'vue'

// The components of the list the wrapper renders, in the order of the list: which of several alternatives is shown
export function findShownComponents<TComponent extends Component>(
  wrapper: Pick<VueWrapper, 'findComponent'>,
  components: TComponent[]
): TComponent[] {
  return components.filter(component => wrapper.findComponent(component).exists())
}
