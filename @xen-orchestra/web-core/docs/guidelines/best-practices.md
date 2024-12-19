# Best practices

## JS/TS variables and props naming SHOULD be meaningful

- Avoid using a single letter or non-meaningful names for variables:

  ❌ Bad

  ```ts
  const m = 'foo'
  ```

  ✅ Good

  ```ts
  const message = 'foo'
  ```

- If the variable is an array of items, use plural for the variable naming:

  ❌ Bad

  ```ts
  const vm: VM[] = []
  ```

  ✅ Good

  ```ts
  const vms: VM[] = []
  ```

- When iterating over arrays, use a meaningful name for each item:

  ❌ Bad

  ```ts
  vms.map(item => item.id)
  ```

  ✅ Good

  ```ts
  vms.map(vm => vm.id)
  ```

- Add blank lines between code blocks for better readability:

  ❌ Bad

  ```ts
  const foo = doThis()
  if (!foo) {
    return 'that'
  }
  return bars.filter(bar => bar.do(foo))
  ```

  ✅ Good

  ```ts
  const foo = doThis()

  if (!foo) {
    return 'that'
  }

  return bars.filter(bar => bar.do(foo))
  ```

## Component SHOULD use `defineProps()`, `defineEmits()`, `defineSlots()`, `defineModel()` macros whenever it's necessary

## Component SHOULD use props destructuring

As we are using Vue 3.5, you can use props destructuring:

```vue
<script setup lang="ts">
const { accent, label = 'foo' } = defineProps<{
  accent: 'success' | 'warning'
  label?: string
}>()
</script>
```

[See documentation](https://vuejs.org/guide/extras/reactivity-transform.html#reactive-props-destructure) for more information.

## Component and composables SHOULD use `useId()`

As we are using Vue 3.5, you can use `useId()` to help you generate IDs in components or composables. [See documentation](https://vuejs.org/api/composition-api-helpers.html#useid) for more information.

## Component SHOULD NOT use options API style for `slots`, `route`, `attrs`, etc.

❌ Bad

```vue
<template>
  <div class="ui-foobar">
    <div class="header" v-bind="$attrs">...</div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })
</script>
```

✅ Good

```vue
<template>
  <div class="ui-foobar">
    <div class="header" v-bind="attrs">...</div>
  </div>
</template>

<script setup lang="ts">
import { useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()
</script>
```

## Use slot + prop for better flexibility

Using slots with fallback to props helps to maintain flexibility: simple data can be passed as props, while slots allow injecting complex content (HTML, conditional logic, etc.) when needed, making components more versatile and reusable.

Take this example, where a component needs to display a child icon component:

```vue
<template>
  <div>
    <slot name="icon" />
    <!--  rest of the code  -->
  </div>
</template>
```

Most of the time you will want to specify which icon to use, rather than having to explicitly use the icon component in the parent component. But in some cases you may want to retain some flexibility and use a different icon component, a more complex one, or rely on a condition to use specific HTML, etc.

In this case, you can combine a slot and a prop as a fallback to handle all these cases.

The component would look like this:

```vue
<template>
  <div>
    <slot name="icon">
      <UiIcon :icon />
    </slot>
    <!--  rest of the code  -->
  </div>
</template>

<script setup lang="ts">
import { defineSlots } from '@vue/runtime-core'

defineProps<{
  icon?: IconType
}>()

defineSlots<{
  icon?(): any
}>()
</script>
```

In this case, you can use the `icon` prop for simple uses, and keep the flexibility of using the slot when needed, as the `UiIcon` component is overwritten when the slot is used.

## Component MUST use inline handler or inline function for event handling

To avoid possible side effects, use inline handlers or function, or call methods in inline handlers instead of using method handlers.

Here is an explanation on why we use this rule:

`@click="deleteMe"` is the equivalent of `@click="deleteMe($event)"` (or `@click="(event) => deleteMe(event)"`).

Let's take this code:

```vue
<template>
  <button @click="deleteMe">Delete</button>
  <button @click="deleteMe(true)">Force Delete</button>
</template>

<script lang="ts" setup>
function deleteMe(force?: boolean) {
  if (force) {
    // ...
  } else {
    // ...
  }
}
</script>
```

In this example, the first button will call `deleteMe(event)` and thus will always take the first condition path.

❌ Bad

```vue
<template>
  <div @click="doSomething" />
  <div @click="doSomething($event)" />
  <div @click="() => count++" />
</template>
```

✅ Good

```vue
<template>
  <div @click="doSomething()" />
  <div @click="value => doSomething(value)" />
  <div @click="count++" />
</template>
```

See also: [inline handlers](https://vuejs.org/guide/essentials/event-handling.html#inline-handlers) in Vue.js documentation.

## Components SHOULD have a Story

> [!TIP]
> For now, stories are stored in
> `@xen-orchestra/lite/src/stories` and can only be written for XO Lite and XO Core components.

## VueUse SHOULD be used when necessary

Instead of recreating some functionality, [VueUse](https://vueuse.org) provides a lot of utilities for common use cases (e.g., accessing browser APIs, using local storage, etc.).
