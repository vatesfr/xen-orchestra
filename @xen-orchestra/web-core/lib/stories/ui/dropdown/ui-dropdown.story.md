# Type

```typescript
type DropdownAccent = 'normal' | 'brand' | 'success' | 'warning' | 'danger'
```

# Example

```vue-template
<UiDropdownList>
  <UiDropdown accent="brand" :icon="faArrowDown" info="current">
    Sort ascending
  </UiDropdown>
  <UiDropdown accent="brand" :icon="faArrowUp">
    Sort descending
  </UiDropdown>
</UiDropdownList>
```

```vue-script
import UiDropdown from '@core/components/ui/dropdown/UiDropdown.vue'
import UiDropdownList from '@core/components/ui/dropdown/UiDropdownList.vue'
import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
```
