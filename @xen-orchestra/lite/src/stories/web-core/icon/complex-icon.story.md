ComplexIcon component usage:

```vue-template
<ComplexIcon>
  <UiIcon :icon="faRotateRight" accent="current" />
  <UiIcon :icon="faLightbulb" accent="current" />
</ComplexIcon>
```

```vue-script
import ComplexIcon from '@core/components/icon/ComplexIcon.vue'
import UiIcon from '@core/components/icon/UiIcon.vue'
import {faLightbulb, faRotateRight} from '@fortawesome/free-solid-svg-icons'
```
