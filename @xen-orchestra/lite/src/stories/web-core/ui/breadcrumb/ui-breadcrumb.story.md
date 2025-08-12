```vue-template
<UiBreadcrumb size="medium">
  <UiLink size="medium" to="#">Site</UiLink>
  <div>
    <UiButtonIcon
      :id="buttonId"
      :aria-controls="listId"
      :aria-expanded="menu.more.$isOpen.value"
      aria-label="Show collapsed links"
      :icon="faEllipsisH"
      size="medium"
      accent="brand"
      v-bind="omit(menu.more.$trigger, ['as', 'type'])"
    />
    <VtsMenuList :id="listId" border :aria-labelledby="buttonId" v-bind="menu.more.$target">
      <UiLink size="medium" v-bind="omit(menu.more['a-link'], ['as'])">A link</UiLink>
      <UiLink size="medium" v-bind="omit(menu.more['another-link'], ['as'])">
        Another link
      </UiLink>
    </VtsMenuList>
  </div>
  <UiLink size="medium" to="#">Backups jobs</UiLink>
  <UiLink size="medium" to="#">Backups logs</UiLink>
  Current page
</UiBreadcrumb>
```

```ts
import VtsMenuList from '@core/components/menu/VtsMenuList.vue'
import UiBreadcrumb from '@core/components/ui/breadcrumb/UiBreadcrumb.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { routerLink, toggle, useMenu } from '@core/packages/menu'
import { faEllipsisH } from '@fortawesome/free-solid-svg-icons'
import { objectOmit as omit } from '@vueuse/shared'
import { useId } from 'vue'

const menu = useMenu({
  more: toggle({
    items: {
      'a-link': routerLink({ name: 'home' }),
      'another-link': routerLink({ name: 'home' }),
    },
  }),
})

const buttonId = useId()
const listId = useId()
```
