```vue-template
<VtsLegendList>
  <UiLegend
    accent="success"
    :value="4"
    unit="GB"
    :on-info-click="openLegendModal"
  >
    Some label
  </UiLegend>
</VtsLegendList>
```

```vue-script
import VtsLegendList from '@core/components/legend-list/VtsLegendList.vue'
import UiLegend from '@core/components/ui/legend/UiLegend.vue'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'

const { open: openLegendModal } = useOverlay({
  component: () => import('./LegendInfoModal.vue'),
  events: {
    onClose: true,
  },
})
```
