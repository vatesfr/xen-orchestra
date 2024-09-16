import type { HideRouteQuery } from '@core/composables/hide-route-query.composable'
import type { VisibilityDefinition } from '@core/composables/table/type'
import { computed } from 'vue'

export function createVisibilityDefinition<THideable extends boolean | undefined>(
  columnId: string,
  hideRouteQuery: HideRouteQuery,
  isHideable: THideable
): VisibilityDefinition<THideable> {
  if (isHideable === false) {
    return {
      isHideable: false,
      isVisible: true,
    } as VisibilityDefinition<THideable>
  }

  const isVisible = computed(() => !hideRouteQuery.value.has(columnId))

  function show() {
    hideRouteQuery.delete(columnId)
  }

  function hide() {
    hideRouteQuery.add(columnId)
  }

  function toggle(value?: boolean) {
    const shouldBeVisible = value ?? !isVisible.value

    if (shouldBeVisible) {
      show()
    } else {
      hide()
    }
  }

  return {
    isHideable: true,
    isVisible,
    show,
    hide,
    toggle,
  } as VisibilityDefinition<THideable>
}
