# Example

```vue-template
<DropdownList>
    <DropdownTitle :icon="faRocket">Rockets</DropdownTitle>
    <DropdownItem>Rocket 1</DropdownItem>
    <DropdownItem>Rocket 2</DropdownItem>
    <DropdownItem>Rocket 3</DropdownItem>
    <DropdownTitle :icon="faShip">Ships</DropdownTitle>
    <DropdownItem>Ship 1</DropdownItem>
    <DropdownItem>Ship 2</DropdownItem>
    <DropdownItem>Ship 3</DropdownItem>
</DropdownList>
```

```vue-script
import DropdownItem from '@core/components/dropdown/DropdownItem.vue'
import DropdownList from '@core/components/dropdown/DropdownList.vue'
import DropdownTitle from '@core/components/dropdown/DropdownTitle.vue'
import { faRocket, faShip } from "@fortawesome/free-solid-svg-icons";
```
