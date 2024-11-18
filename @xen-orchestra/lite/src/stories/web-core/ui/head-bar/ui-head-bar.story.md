`UiHeadBar` component usage with `ObjectIcon` and `UiButton` components:

```vue-template
<UiHeadBar>
  Host name
  <template #icon>
    <ObjectIcon type="host" state="running" size="medium" />
  </template>
  <template #actions>
    <UiButton size="medium" level="primary" color="info" :left-icon="faPlus">New VM</UiButton>
    <UiButton size="medium" level="secondary" color="info" :left-icon="faPowerOff">Change state</UiButton>
  </template>
</UiHeadBar>
```

```vue-script
import UiButton from '@core/components/button/UiButton.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import ObjectIcon from '@core/components/icon/ObjectIcon.vue'
import { faPlus, faPowerOff } from '@fortawesome/free-solid-svg-icons'
```
