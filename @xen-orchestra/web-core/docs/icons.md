# Icons

XO Lite / 6 / Core projects are using Font Awesome 6 Free.

Icons can be displayed with the `VtsIcon` component.

The component takes an `icon` prop that should be an icon object imported from `@fortawesome/free-solid-svg-icons` or `@fortawesome/free-regular-svg-icons`.

If the `icon` prop is `undefined`, then the component will be ignored (no need to use an additional `v-if` condition).

Use the `busy` prop to display a loader icon.

## Example

```vue
<template>
  <div>
    <VtsIcon :icon="faDisplay" accent="current" />
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { faDisplay } from '@fortawesome/free-solid-svg-icons'
</script>
```
