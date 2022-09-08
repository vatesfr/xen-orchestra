# Tooltip Directive

By default, tooltip will appear centered above the target element.

## Usage

```vue
<template>
  <!-- Static -->
  <span v-tooltip="'Tooltip content'">Item</span>

  <!-- Dynamic -->
  <span v-tooltip="myTooltipContent">Item</span>

  <!-- Placement  -->
  <span v-tooltip="{ content: 'Foobar', placement: 'left-end' }">Item</span>

  <!-- Disabling (variable) -->
  <span v-tooltip="{ content: 'Foobar', disabled: isDisabled }">Item</span>

  <!-- Disabling (function) -->
  <span v-tooltip="{ content: 'Foobar', disabled: isDisabledFn }">Item</span>
</template>

<script setup>
import { ref } from "vue";
import { vTooltip } from "@/directives/tooltip.directive";

const myTooltipContent = ref("Content");
const isDisabled = ref(true);

const isDisabledFn = (target: Element) => {
  // return boolean;
};
</script>
```
