# Component definition

Lexicon:

- DS: Design System
- SFC: Single-File Component
- Component: A Vue component (being defined in the DS or not)
- DS Component: A component specifically defined in the Design System (DS)
- Subcomponent: A component that is part of a Component or a DS Component

## Components and Subcomponents MUST be defined as Vue SFC (Single-File Component)

## DS Components MUST be stored in their own directory.

## Directory name MUST be in kebab-case (e.g. `my-component`)

## Component name MUST be in PascalCase

## DS Component/Subcomponent name MUST start with `Vts` (e.g. `VtsMyComponent.vue`)

❌ Bad

`components/Square.vue`

✅ Good

`components/square/VtsSquare.vue`

## Components SHOULD be kept short and be split into multiple subcomponents if necessary, stored in the same directory as the main component.

❌ Bad

```
/components/
  /square/
    /VtsSquare.vue
  /square-icon/
    /VtsSquareIcon.vue <- This component is not part of the DS and will be used only in Square.vue
```

✅ Good

```
/components/
  /square/
    /VtsSquare.vue
    /VtsSquareIcon.vue
```

> [!WARNING]
> If you think that a subcomponent is likely to be reused in other components,
> ask the DS team to define it in the DS.
>
> It will be then moved in its own directory, following the DS guidelines.

## DS Components MUST start with an HTML comment containing the implemented version

In the form `v1`, `v2`, etc.

> [!TIP]
> The DS team can use a minor version to indicate a change in the DS that does not affect the component style.
>
> It must not be added to the Vue component version.

❌ Bad

```vue
<!-- v1.2 -->
<template>
  <!-- code -->
</template>
```

✅ Good

```vue
<!-- v1 -->
<template>
  <!-- code -->
</template>
```

## Subcomponents MUST NOT have a version number

If a component from the DS is split into multiple subcomponents, only the main component will have a version number

## Component tags MUST follow `template`, `script` then `style` order, separated with an empty line

## Class names MUST use kebab-case

## Component root element's class name MUST be named after the component name

If no style is applied to the root element, the class name will be omitted

❌ Bad

```vue
<!-- VtsSquare.vue -->
<template>
  <div class="my-shape" />
</template>
```

```vue
<!-- VtsSquare.vue -->
<template>
  <div class="square" />
</template>
```

✅ Good

```vue
<!-- VtsSquare.vue -->
<template>
  <div class="vts-square" />
</template>
```

```vue
<!-- VtsSquareIcon.vue -->
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
    <div class="component-label">
      <slot />
    </div>
  </div>
</template>
```

✅ Good

```vue
<template>
  <div class="vts-square">
    <Icon :icon="faSmile" class="icon" />
    <div class="label">
      <slot />
    </div>
  </div>
</template>
```

## Component MUST use `<style lang="postcss" scoped>`

## Component CSS must be contained under the root CSS classname

❌ Bad

```vue
<style scoped>
.vts-square {
  /* styles... */
}

.icon {
  /* styles... */
}
</style>
```

✅ Good

```vue
<style scoped>
.vts-square {
  /* styles... */

  .icon {
    /* styles... */
  }
}
</style>
```

> [!TIP]
> See also [Component variants guidelines](component-variants.md)
> to learn how to handle different component styles based on its props or states.

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
> For now, stories are stored in
> `@xen-orchestra/lite/src/stories` and can only be written for XO Lite and XO Core components.
