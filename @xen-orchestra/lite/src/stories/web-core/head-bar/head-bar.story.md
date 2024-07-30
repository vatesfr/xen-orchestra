`HeadBar` component usage with `ObjectIcon` and `UiButton` components:

```vue-template
<HeadBar>
  Host name
  <template #icon>
    <ObjectIcon type="host" state="running" size="medium" />
  </template>
  <template #actions>
    <UiButton size="small" :left-icon="faPlus">New VM</UiButton>
    <UiButton size="small" :left-icon="faPowerOff">Change state</UiButton>
  </template>
</HeadBar>
```

```vue-script
import UiButton from '@core/components/button/UiButton.vue'
import HeadBar from '@core/components/head-bar/HeadBar.vue'
import ObjectIcon from '@core/components/icon/ObjectIcon.vue'
import { faPlus, faPowerOff } from '@fortawesome/free-solid-svg-icons'
```
