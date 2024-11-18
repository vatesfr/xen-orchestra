```vue-template
<VtsLegendGroup :items :title />
```

```vue-script
import VtsLegendGroup, { type LegendGroupProps } from '@core/components/legend/VtsLegendGroup.vue'
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'

const items: LegendGroupProps['items'] = [
  {
    label: 'First segment',
    accent: 'info',
    value: 42,
    unit: '%'
  },
  {
    label: 'Second segment',
    accent: 'neutral',
    value: 58,
    unit: '%',
    tooltip: 'This is another tooltip'
  }
]

const title: LegendGroupProps['title'] = {
  label: 'Legend Title',
  icon: faInfoCircle,
  iconTooltip: 'This is a tooltip'
}
```
