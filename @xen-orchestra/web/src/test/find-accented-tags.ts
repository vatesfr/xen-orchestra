import UiTag from '@core/components/ui/tag/UiTag.vue'
import type { VueWrapper } from '@vue/test-utils'

// Read as the `{ label, accent }` a composable hands to the component, in order
export function findAccentedTags(wrapper: Pick<VueWrapper, 'findAllComponents'>) {
  return wrapper.findAllComponents(UiTag).map(tag => ({ label: tag.text(), accent: tag.props('accent') }))
}
