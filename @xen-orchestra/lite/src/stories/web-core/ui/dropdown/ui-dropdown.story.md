# Type

```typescript
type DropdownAccent = 'normal' | 'brand' | 'success' | 'warning' | 'danger'
```

# Example

```vue-template
<UiDropdownList>
  <UiDropdown accent="brand" icon="fa:arrow-down" info="current">
    Sort ascending
  </UiDropdown>
  <UiDropdown accent="brand" icon="fa:arrow-up">
    Sort descending
  </UiDropdown>
</UiDropdownList>
```

```vue-script
import UiDropdown from '@core/components/ui/dropdown/UiDropdown.vue'
import UiDropdownList from '@core/components/ui/dropdown/UiDropdownList.vue'
```
