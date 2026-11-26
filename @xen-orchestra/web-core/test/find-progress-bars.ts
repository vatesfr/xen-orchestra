import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'
import type { VueWrapper } from '@vue/test-utils'

type ProgressBarWrapper = Pick<VueWrapper, 'findAllComponents'>

const findProgressBars = (wrapper: ProgressBarWrapper) => wrapper.findAllComponents(UiProgressBar)

// The fill width each `UiProgressBar` of the wrapper is handed (`'25%'`), in order
export function findProgressBarFills(wrapper: ProgressBarWrapper) {
  return findProgressBars(wrapper).map(bar => bar.props('fillWidth'))
}

// The accent each `UiProgressBar` of the wrapper is handed, in order
export function findProgressBarAccents(wrapper: ProgressBarWrapper) {
  return findProgressBars(wrapper).map(bar => bar.props('accent'))
}
