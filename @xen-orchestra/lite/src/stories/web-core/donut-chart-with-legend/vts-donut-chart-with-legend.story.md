```vue-template
<VtsDonutChartWithLegend :segments :title />
```

```vue-script
import VtsDonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'

const { open: openLegendModal } = useOverlay({
  component: () => import('./LegendInfoModal.vue'),
  events: {
    onClose: true,
  },
})

const segments: DonutChartWithLegendProps['segments'] = [
  { value: 16, accent: 'success', label: 'Online' },
  { value: 22, accent: 'warning', label: 'Maintenance', onInfoClick: () => openLegendModal() },
  { value: 35, accent: 'danger', label: 'Offline' },
  { value: 12, accent: 'muted', label: 'Unknown' },
]

const title: DonutChartWithLegendProps['title'] = {
  label: 'Chart Title',
  icon: 'fa:info-circle',
  iconTooltip: 'Some tooltip',
}
```
