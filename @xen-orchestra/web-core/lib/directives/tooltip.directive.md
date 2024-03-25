# Tooltip Directive

By default, the tooltip will appear centered above the target element.

## Directive argument

The directive argument is **optional** and can be either:

- The tooltip [content](#tooltip-content)
- An object containing:
  - `content`: The tooltip [content](#tooltip-content)
  - `placement`: The tooltip [placement](#tooltip-placement)
  - `selector`: A descendant [selector](#tooltip-selector)
  - `vertical`: A boolean to enable [vertical mode](#tooltip-vertical)

## Automatic mode

When the tooltip content is `true` or `undefined`, the directive will check the target element to see if it has text
overflow.

If so, the directive will automatically create a tooltip with the target element's text content.

By default, the target element is the one the directive is attached to.

This can be changed by using the [`selector`](#tooltip-selector) option.

## Tooltip `content`

The tooltip content can be either:

- `true` or `undefined` to enable the [automatic mode](#automatic-mode).
- `false` or an empty-string to disable the tooltip
- Non-empty string to enable the tooltip and use the string as content.

## Tooltip `placement`

Tooltip can be placed in the following positions:

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

## Tooltip `selector`

When in automatic mode, by default, the directive will check if the element on which is attached the directive has text
overflow.

If you want to check the overflow of a descendant element, you can use the `selector` option.

## Tooltip `vertical`

By default, the overflow check is done horizontally.

If you want to check the vertical overflow, you can set the `vertical` option to `true`.

## Usage

```vue
<template>
  <!-- True -->
  <div v-tooltip="true" class="label">This content will be ellipsized by CSS but displayed entirely in the tooltip</div>

  <!-- Undefined / Unset -->
  <div v-tooltip class="label">This content will be ellipsized by CSS but displayed entirely in the tooltip</div>

  <!-- String -->
  <div v-tooltip="'Tooltip content'" class="label">This item will have "Tooltip content" as tooltip</div>

  <!-- Object -->
  <div v-tooltip="{ content: 'Foobar', placement: 'left-end' }" class="label">
    This item will have "Foobar" as tooltip and the tooltip will be placed at the bottom left of the item
  </div>

  <!-- Dynamic -->
  <div v-tooltip="myTooltip" class="label">This item will have the content of `myTooltip` as tooltip</div>

  <!-- Conditional -->
  <div v-tooltip="isTooltipEnabled && 'Foobar'" class="label">
    This item will have "Foobar" as tooltip if `isTooltipEnabled` is true
  </div>

  <!-- Selector -->
  <div v-tooltip="{ selector: '.label' }">
    Before
    <div class="label">
      This content will be ellipsized by CSS but displayed entirely in the tooltip attached to the parent element
    </div>
    After
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { vTooltip } from '@core/directives/tooltip.directive'

const myTooltip = ref('Content') // or ref({ content: "Content", placement: "left-end" })
const isTooltipEnabled = ref(true)
</script>

<style scoped>
div {
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
```
