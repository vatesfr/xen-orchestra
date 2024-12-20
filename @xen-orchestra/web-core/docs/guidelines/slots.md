## Component MUST use `defineSlots` when slots are used

❌ Bad

```vue
<template>
  <div class="ui-foobar">
    <slot />
    <slot name="footer" />
  </div>
</template>
```

```vue
<template>
  <div class="ui-foobar">
    <slot foo="bar" />
  </div>
</template>
```

✅ Good

```vue
<template>
  <div class="ui-foobar">
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

## Optional slots container SHOULD use `v-if="slots.<slotName>"`

The `slots` variable should be defined in the `script` tag of the component, like this: `const slots = defineSlots<{...}>()`

❌ Bad

```vue
<template>
  <div class="ui-foobar">
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
  <div class="ui-foobar">
    <div v-if="slots.header" class="header">
      <slot name="header" />
    </div>
    <slot />
    <div v-if="slots.footer" class="footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
const slots = defineSlots<{
  // Define the `slots` variable here
  default(): any
  header?(): any
  footer?(): any
}>()
</script>
```

## Optional slots SHOULD be marked as is in the script tag

Let's take an example of two slots, the `default` one is required, and the `header` slot is optional:

❌ Bad

```vue
<script setup lang="ts">
const slots = defineSlots<{
  default(): any
  header(): any
}>()
</script>
```

✅ Good

```vue
<script setup lang="ts">
const slots = defineSlots<{
  default(): any
  header?(): any // <- optional slot, note the question mark
}>()
</script>
```
