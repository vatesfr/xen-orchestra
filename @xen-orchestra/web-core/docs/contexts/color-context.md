<!-- TOC -->

- [Overview](#overview)
  - [CSS variables](#css-variables)
  - [Available color contexts](#available-color-contexts)
  - [Usage](#usage)
  <!-- TOC -->

# Overview

The color context provides a way to apply a set of colors variants to a component and all its descendants at any depth.

Each descendant has the ability to change the context value, affecting itself and all of its descendants at any level.

The purpose is to colorize a component and its descendants by applying a single CSS class on the parent component (e.g., applying the class on a modal component container will style all children components using the context).

## CSS variables

The color context relies on the usage of the following variables:

```css
--color-context-primary;
--color-context-primary-hover;
--color-context-primary-active;
--color-context-primary-disabled;

--color-context-secondary;
--color-context-secondary-hover;
--color-context-secondary-active;

--color-context-tertiary;
```

Any component can use these variables for `color`, `background-color` or any other CSS property, to be usable with the color context.

When you set a color context, the variables are updated with the help of CSS classes defined in `_context.pcss`:

```css
.color-context-info {
  --color-context-primary: var(--color-normal-txt-base);
  --color-context-primary-hover: var(--color-normal-txt-hover);
  --color-context-primary-active: var(--color-normal-txt-active);
  --color-context-primary-disabled: var(--color-neutral-txt-secondary);

  --color-context-secondary: var(--color-normal-background-selected);
  --color-context-secondary-hover: var(--color-normal-background-hover);
  --color-context-secondary-active: var(--color-normal-background-active);
}

.color-context-success {
  --color-context-primary: var(--color-success-txt-base);
  --color-context-primary-hover: var(--color-success-txt-hover);
  /*...*/
}
```

You can add any other context by adding a `color-context-<my-context>` class and setting the desired values for the variables.

**Important note: remember to set a value for all variables to avoid any missing styles.**

## Available color contexts

Color contexts rely on the type `Color` defined in `/lib/types/color.type.ts`:

- `info` (_purple_)
- `success` (_green_)
- `warning` (_orange_)
- `error` (_red_)

## Usage

To get and set the color context in a component, you can pass the `ColorContext` to `useContext` and apply the `colorContextClass` to the root component:

```ts
// ParentComponent.vue

import { useContext } from '@core/composables/context.composable'
import { ColorContext } from '@core/context'
import type { Color } from '@core/types/color.type'
import { defineProps } from 'vue'

const props = defineProps<{
  color?: Color
}>()

const { colorContextClass } = useContext(ColorContext, () => props.color)
```

All the components using the CSS variables will inherit the color context applied by the `colorContextClass`.
It's possible to change the color of a component on demand, if the component has a `color` prop, and passing it as the second parameter of the composable.

Then, the only thing to do is to apply the class in the component's `template`:

```vue
<!-- ParentComponent.vue -->

<template>
  <div :class="colorContextClass">
    <!--  Will use the color context defined by the class above-->
    <MyComponent />

    <!--  Will use the color "info" instead of the context-->
    <MyComponent color="info" />
  </div>
</template>
```

`MyComponent` using the context:

```vue
<!-- MyComponent.vue -->

<template>
  <div :class="colorContextClass" class="my-component">
    <p>Lorem ipsum dolor sit amet.</p>
  </div>
</template>

<script lang="ts" setup>
import { useContext } from '@core/composables/context.composable'
import { ColorContext } from '@core/context'
import type { Color } from '@core/types/color.type'
import { defineProps } from 'vue'

const props = defineProps<{
  color?: Color
}>()

const { colorContextClass } = useContext(ColorContext, () => props.color)
</script>

<style lang="postcss" scoped>
.my-component {
  background-color: var(--color-context-secondary);
  color: var(--color-context-primary);
}
</style>
```

In the example above, if the `color` prop is not set, the component will use the color context (i.e., if its parent uses a `success` color context, `MyComponent` will be styled with the `success` colors defined in `_context.pcss`).

If the `color` prop is set, the component will use the prop value to update the context for itself and its descendants.
