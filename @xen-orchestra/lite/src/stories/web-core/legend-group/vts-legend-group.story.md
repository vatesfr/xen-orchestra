```vue-template
<VtsLegendGroup :items :title />
```

```vue-script
import VtsLegendGroup, { type LegendGroupProps } from '@core/components/legend/VtsLegendGroup.vue'

const items: LegendGroupProps['items'] = [
  {
    label: 'First segment',
    accent: 'info',
    value: 42,
    unit: '%'
  },
  {
    label: 'Second segment',
    accent: 'info',
    value: 58,
    unit: '%',
    iconTooltip: true
    @open-modal="openInfoModal()"
  }
]

const title: LegendGroupProps['title'] = {
  label: 'Legend Title',
  icon: 'fa:info-circle',
  iconTooltip: true
  @open-modal="openInfoModal()"
}
```
