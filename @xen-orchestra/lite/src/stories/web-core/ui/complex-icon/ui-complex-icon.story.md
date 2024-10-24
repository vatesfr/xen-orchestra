ComplexIcon component usage:

```vue-template
<UiComplexIcon>
  <VtsIcon :icon="faRotateRight" accent="current" />
  <VtsIcon :icon="faLightbulb" accent="current" />
</UiComplexIcon>
```

```vue-script
import UiComplexIcon from '@core/components/ui/complex-icon/UiComplexIcon.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import {faLightbulb, faRotateRight} from '@fortawesome/free-solid-svg-icons'
```
