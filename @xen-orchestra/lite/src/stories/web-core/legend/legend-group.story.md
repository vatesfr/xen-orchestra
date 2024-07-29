```vue-template
<LegendGroup :items :title />
```

```vue-script
import LegendGroup, { type LegendGroupProps } from '@core/components/legend/LegendGroup.vue'
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'

const items: LegendGroupProps['items'] = [
  {
    label: 'First segment',
    color: 'primary',
    value: 42,
    unit: '%'
  },
  {
    label: 'Second segment',
    color: 'secondary',
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
