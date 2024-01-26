# Tooltip Directive

By default, the tooltip will appear centered above the target element.

## Directive argument

The directive argument can be either:

- The tooltip content
- An object containing the tooltip content and/or placement: `{ content: "...", placement: "..." }` (both optional)

## Tooltip content

The tooltip content can be either:

- `false` or an empty-string to disable the tooltip
- `true` or `undefined` to enable the tooltip and extract its content from the element's innerText.
- Non-empty string to enable the tooltip and use the string as content.

## Tooltip placement

Tooltip can be placed on the following positions:

- `top`
- `top-start`
- `top-end`
- `bottom`
- `bottom-start`
- `bottom-end`
- `left`
- `left-start`
- `left-end`
- `right`
- `right-start`
- `right-end`

## Usage

```vue
<template>
  <!-- Boolean / Undefined -->
  <span v-tooltip="true">This content will be ellipsized by CSS but displayed entirely in the tooltip</span>
  <span v-tooltip>This content will be ellipsized by CSS but displayed entirely in the tooltip</span>

  <!-- String -->
  <span v-tooltip="'Tooltip content'">Item</span>

  <!-- Object -->
  <span v-tooltip="{ content: 'Foobar', placement: 'left-end' }">Item</span>

  <!-- Dynamic -->
  <span v-tooltip="myTooltip">Item</span>

  <!-- Conditional -->
  <span v-tooltip="isTooltipEnabled && 'Foobar'">Item</span>
</template>

<script setup>
import { ref } from 'vue'
import { vTooltip } from '@/directives/tooltip.directive'

const myTooltip = ref('Content') // or ref({ content: "Content", placement: "left-end" })
const isTooltipEnabled = ref(true)
</script>
```
