# Component definition

Lexicon:

- DS: Design System
- SFC: Single-File Component
- Component: A component defined in the Design System (DS)
- Subcomponent: A component that is part of a Component

## Components and Subcomponents MUST be defined as Vue SFC (Single-File Component)

## Components SHOULD be named according to their name in the DS (Design System)

## Components SHOULD be kept short and be split into multiple subcomponents if necessary, stored in the same directory

✅ Good

```
/components/
  /square/
    /Square.vue
    /SquareIcon.vue
```

## Components from DS MUST start with an HTML comment containing the implemented version

In the form `v<x>.<y>` (`z` is reserved to DS versioning)

❌ Bad

```vue
<!-- v1.2.0 -->
<template>
  <!-- code -->
</template>
```

✅ Good

```vue
<!-- v1.2 -->
<template>
  <!-- code -->
</template>
```

## Subcomponents MUST NOT have a version number

If a component from the DS is split into multiple subcomponents, only the main component will have a version number

## Components MUST be stored in their own directory

❌ Bad

`components/Square.vue`

✅ Good

`components/square/Square.vue`

## Component tags MUST follow `template`, `script` then `style` order, separated with an empty line

## Class names MUST use kebab-case

## Component root element's class name MUST be named after the component name, prefixed with `vts-`

If no style is applied to the root element, the class name will be omitted

❌ Bad

```vue
<!-- Square.vue -->
<template>
  <div class="my-shape" />
</template>
```

```vue
<!-- Square.vue -->
<template>
  <div class="square" />
</template>
```

✅ Good

```vue
<!-- Square.vue -->
<template>
  <div class="vts-square" />
</template>
```

```vue
<!-- SquareIcon.vue -->
<template>
  <div class="vts-square-icon" />
</template>
```

## Class names SHOULD be short and MUST be meaningful

❌ Bad

```vue
<template>
  <div class="vts-square">
    <Icon :icon="faSmile" class="square-icon" />
    <div class="component-label"><slot /></div>
  </div>
</template>
```

✅ Good

```vue
<template>
  <div class="vts-square">
    <Icon :icon="faSmile" class="icon" />
    <div class="label"><slot /></div>
  </div>
</template>
```

## Component MUST use `<style scoped>`

## Component SHOULD NOT use nested CSS, unless necessary

With meaningful class names + scoped styles, in most cases it will not be necessary to use nested CSS

❌ Bad

```vue
<style scoped>
.my-component {
  /* styles... */

  .icon {
    /* styles... */
  }
}
</style>
```

✅ Good

```vue
<style scoped>
.my-component {
  /* styles... */
}

.icon {
  /* styles... */
}
</style>
```

## Optional slots container SHOULD use `v-if="$slots.<slotName>"`

❌ Bad

```vue
<template>
  <div class="vts-foobar">
    <div class="header">
      <slot name="header" />
    </div>
    <slot />
    <div class="footer">
      <slot name="footer" />
    </div>
  </div>
</template>
```

✅ Good

```vue
<template>
  <div class="vts-foobar">
    <div v-if="$slots.header" class="header">
      <slot name="header" />
    </div>
    <slot />
    <div v-if="$slots.footer" class="footer">
      <slot name="footer" />
    </div>
  </div>
</template>
```

## Component MUST use `defineSlots` when slots are used

❌ Bad

```vue
<template>
  <div class="vts-foobar">
    <slot />
    <slot name="footer" />
  </div>
</template>
```

```vue
<template>
  <div class="vts-foobar">
    <slot foo="bar" />
  </div>
</template>
```

✅ Good

```vue
<template>
  <div class="vts-foobar">
    <slot />
    <slot name="footer" foo="bar" />
  </div>
</template>

<script lang="ts" setup>
defineSlots<{
  default(): any
  footer(props: { foo: string }): any
}>()
</script>
```

## Component SHOULD have a Story

> [!TIP]
> For now, stories are stored in `@xen-orchestra/lite/src/stories` and can only be written for XO Lite and XO Core components.
