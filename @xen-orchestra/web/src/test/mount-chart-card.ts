import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { VtsLinearChartStub } from '@/test/linear-chart-stub.ts'
import { mount } from '@vue/test-utils'
import type { Component } from 'vue'

export type ChartCardProps<TStats> = {
  data: TStats | null
  loading?: boolean
  error?: boolean
}

/**
 * Mounts a dashboard chart card with its `VtsLinearChart` stubbed, so the
 * plotted series stay readable through {@link findLinearChart} — see
 * [Chart cards](../../docs/tests/testing-components.md#chart-cards).
 *
 * `loading` defaults to `false`: a card left loading renders only its hero, and
 * every test but the loader ones wants the chart.
 *
 * Wrap it per card to bind the component and its stats type:
 * `const mountChart = (props: ChartCardProps<XapiHostStats>) => mountChartCard(HostDashboardRamUsageChart, props)`
 */
export function mountChartCard<TStats>(component: Component, props: ChartCardProps<TStats>) {
  return mount(component, {
    props: { loading: false, ...props },
    global: { ...createGlobalTestConfig(), stubs: { VtsLinearChart: VtsLinearChartStub } },
  })
}
