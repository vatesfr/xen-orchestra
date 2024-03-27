# Example

```vue-template
<DropdownList>
  <DropdownItem :icon="faArrowDown" info="current">
    Sort ascending
  </DropdownItem>
  <DropdownItem :icon="faArrowUp">
    Sort descending
  </DropdownItem>
</DropdownList>
```

```vue-script
import DropdownItem from '@core/components/dropdown/DropdownItem.vue'
import DropdownList from '@core/components/dropdown/DropdownList.vue'
import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
```
