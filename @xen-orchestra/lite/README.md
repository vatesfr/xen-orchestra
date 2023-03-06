# POC XO Lite

- Clone
- Copy `.env.dist` to `.env` and set vars
- `yarn`
- `yarn dev`

## Conventions

### File names

| Type       | Format                                   | Exemple                             |
| ---------- | ---------------------------------------- | ----------------------------------- |
| Component  | `components/<PascalCase>.vue`            | `components/FooBar.vue`             |
| View       | `views/<PascalCase>View.vue`             | `views/FooBarView.vue`              |
| Composable | `composables/<kebab-case>.composable.ts` | `composables/foo-bar.composable.ts` |
| Store      | `stores/<kebab-case>.store.ts`           | `stores/foo-bar.store.ts`           |
| Other      | `libs/<kebab-case>.ts`                   | `libs/foo-bar.ts`                   |

For components and views, prepend the subdirectories names to the resulting filename.

Example: `components/foo/bar/FooBarBaz.vue`

### Vue Components

Use Vue Single File Components (`*.vue`).

Insert blocks in the following order: `template`, `script` then `style`.

#### Template

Use HTML.

If your component only has one root element, add the component name as a class.

```vue
<!-- MyComponent.vue -->
<template>
  <div class="my-component">...</div>
</template>
```

#### Script

Use composition API + TypeScript + `setup` attribute (`<script lang="ts" setup>`).

Note: When reading Vue official doc, don't forget to set "API Preference" toggle (in the upper left) on "Composition".

```vue
<script lang="ts" setup>
import { computed, ref } from "vue";

const props = defineProps<{
  greetings: string;
}>();

const firstName = ref("");
const lastName = ref("");

const fullName = computed(
  () => `${props.greetings} ${firstName.value} ${lastName.value}`
);
</script>
```

#### CSS

Always use `scoped` attribute (`<style scoped>`).

Nested rules are allowed.

Vue variables can be interpolated with `v-bind`.

```vue
<script lang="ts" setup>
import { ref } from "vue";

const fontSize = ref("2rem");
</script>

<style scoped>
.my-item {
  .nested {
    font-size: v-bind(fontSize);
  }
}
</style>
```

### Icons

This project is using Font Awesome 6 Free.

Icons can be displayed with the `UiIcon` component.

Passing `undefined` as `icon` prop will disable the component (no need to use an additional `v-if` condition).

Use the `busy` prop to display a loader icon.

```vue
<template>
  <div>
    <UiIcon :icon="faDisplay" />
  </div>
</template>

<script lang="ts" setup>
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import { faDisplay } from "@fortawesome/free-solid-svg-icons";
</script>
```

#### Font weight <=> Style name

Here is the equivalent between font weight and style name.

| Style name | Font weight |
| ---------- | ----------- |
| Solid      | 900         |
| Regular    | 400         |

### CSS

Always use `rem` unit (`1rem` = `10px`)

### Store

Use Pinia store with setup function.

State are `ref`

Getters are `computed`

Actions/Mutations are simple functions

#### Naming convention

For a `foobar` store, create a `store/foobar.store.ts` then use `defineStore('foobar', setupFunc)`

#### Example

```typescript
import { computed, ref } from "vue";

export const useFoobarStore = defineStore("foobar", () => {
  const aStateVar = ref(0);
  const otherStateVar = ref(0);
  const aGetter = computed(() => aStateVar.value * 2);
  const anAction = () => (otherStateVar.value += 10);

  return {
    aStateVar,
    otherStateVar,
    aGetter,
    anAction,
  };
});
```

#### Xen Api Collection Stores

When creating a store for a Xen Api objects collection, use the `createXenApiCollectionStoreContext` helper.

```typescript
export const useConsoleStore = defineStore("console", () =>
  createXenApiCollectionStoreContext("console")
);
```

##### Extending the base context

Here is how to extend the base context:

```typescript
import { computed } from "vue";

export const useFoobarStore = defineStore("foobar", () => {
  const baseContext = createXenApiCollectionStoreContext("foobar");

  const myCustomGetter = computed(() => baseContext.ids.reverse());

  return {
    ...baseContext,
    myCustomGetter,
  };
});
```

### I18n

Internationalization of the app is done with [Vue-i18n](https://vue-i18n.intlify.dev/).

Locale files are located in `src/locales` directory.

Source of truth is `en-US.json` file.

To quickly check if there are missing translations in other locale files, open `main.ts` and check the `messages`
property of `createI18n()` for TypeScript error.

#### Example

```json
{
  "hello": "Hello",
  "hello_name": "Hello {name}",
  "hello_linked": "@:hello_name how are you?",
  "hello_plural": "No hello | Hello to you | Hello to {count} persons"
}
```

```html
<!-- String -->

<p>{{ $t("hello") }}</p>
<!-- Hello -->
<p>{{ $t("hello_name", { name: "World" }) }}</p>
<!-- Hello World -->
<p>{{ $t("hello_linked", { name: "World" }) }}</p>
<!-- Hello World how are you? -->
<p>{{ $tc("hello_plural", 0) }}</p>
<!-- No hello -->
<p>{{ $tc("hello_plural", 1) }}</p>
<!-- Hello to you -->
<p>{{ $tc("hello_plural", 4) }}</p>
<!-- Hello to 4 persons -->

<!-- Date and time -->

<p>{{ $d(date, "date_short") }}</p>
<!-- 9/10/2022 -->
<p>{{ $d(date, "date_medium") }}</p>
<!-- Sep 10, 2022 -->
<p>{{ $d(date, "date_long") }}</p>
<!-- September 10, 2022 -->
<p>{{ $d(date, "datetime_short") }}</p>
<!-- 9/10/2022, 06:30 PM -->
<p>{{ $d(date, "datetime_medium") }}</p>
<!-- Sep 10, 2022, 06:30 PM -->
<p>{{ $d(date, "datetime_long") }}</p>
<!-- September 10, 2022 at 06:30 PM -->
<p>{{ $d(date, "time") }}</p>
<!-- 06:30 PM -->

<!-- Number -->

<p>{{ $n(1234567.898765) }}</p>
<!-- 1,234,567.899 -->
```
