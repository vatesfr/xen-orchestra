import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import type { VueWrapper } from '@vue/test-utils'

type AccentedComponents = Pick<VueWrapper, 'findAllComponents'>

// Read as the `{ label, accent }` a composable hands to the component, in order
function findAccentedLabels(wrapper: AccentedComponents, component: typeof UiTag | typeof UiInfo) {
  return wrapper.findAllComponents(component).map(found => ({ label: found.text(), accent: found.props('accent') }))
}

export function findAccentedTags(wrapper: AccentedComponents) {
  return findAccentedLabels(wrapper, UiTag)
}

export function findAccentedInfos(wrapper: AccentedComponents) {
  return findAccentedLabels(wrapper, UiInfo)
}
