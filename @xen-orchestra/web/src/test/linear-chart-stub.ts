import type { LinearChartData } from '@core/types/chart.ts'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, type PropType } from 'vue'

/**
 * Stands in for the `VtsLinearChart` every dashboard card loads asynchronously.
 * ECharts needs a canvas and a `ResizeObserver`, neither of which happy-dom
 * provides, so the real chart cannot mount here — and stubbing it with `true`
 * would push the props into attributes, where they arrive stringified. Declaring
 * them is what keeps the plotted series readable through {@link findLinearChart}.
 */
export const VtsLinearChartStub = defineComponent({
  name: 'VtsLinearChart',
  props: {
    data: { type: Array as PropType<LinearChartData>, required: true },
    maxValue: { type: Number, required: true },
  },
  template: '<div class="vts-linear-chart-stub" />',
})

/**
 * Reads the chart a card plots, so a test can assert the series it stacked and
 * the maximum it rounded its axis up to. Mount with
 * `stubs: { VtsLinearChart: VtsLinearChartStub }` for this to resolve.
 */
export function findLinearChart(wrapper: VueWrapper) {
  return wrapper.findComponent(VtsLinearChartStub)
}
