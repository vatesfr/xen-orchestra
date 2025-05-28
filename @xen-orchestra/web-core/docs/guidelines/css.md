# CSS guidelines

## Class names MUST use kebab-case

## Component root element's class name MUST be named after the component name

If no style is applied to the root element, the class name will be omitted

❌ Bad

```vue
<!-- UiSquare.vue -->
<template>
  <div class="my-shape" />
</template>
```

```vue
<!-- UiSquare.vue -->
<template>
  <div class="square" />
</template>
```

✅ Good

```vue
<!-- UiSquare.vue -->
<template>
  <div class="ui-square" />
</template>
```

```vue
<!-- SquareIcon.vue -->
<template>
  <div class="square-icon" />
</template>
```

```vue
<!-- VtsDivider.vue -->
<template>
  <div class="vts-divider" />
</template>
```

## Class names SHOULD be short and MUST be meaningful

❌ Bad

```vue
<!-- UiSquare.vue -->
<template>
  <div class="ui-square">
    <Icon :icon="faSmile" class="square-icon" />
    <div class="component-label">
      <slot />
    </div>
  </div>
</template>
```

✅ Good

```vue
<!-- UiSquare.vue -->
<template>
  <div class="ui-square">
    <Icon :icon="faSmile" class="icon" />
    <div class="label">
      <slot />
    </div>
  </div>
</template>
```

## Dynamic class names on the root element MUST be named as `className`

❌ Bad

```
<!-- UiSquare.vue -->
<template>
  <div class="ui-square" :class="classes" />
</template>

<script setup lang="ts">
const classes = computed(() => {
  return [
    isMobile.value ? 'typo-caption-small' : 'typo-caption',
    toVariants({
      accent,
      size,
    }),
  ]
})
</script>
```

✅ Good

```
<!-- UiSquare.vue -->
<template>
  <div class="ui-square" :class="className" />
</template>

<script setup lang="ts">
const className = computed(() => {
  return [
    isMobile.value ? 'typo-caption-small' : 'typo-caption',
    toVariants({
      accent,
      size,
    }),
  ]
})
</script>
```

## Component MUST use `<style lang="postcss" scoped>`

## Component CSS MUST be contained under the root CSS classname

❌ Bad

```vue
<style scoped>
.ui-square {
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
.ui-square {
  /* styles... */

  .icon {
    /* styles... */
  }
}
</style>
```

## `rem` unit SHOULD be used instead of `px`

## Component MUST use helper classes for typography

The DS relies on a fixed set of font sizes, weights, styles, etc.

To avoid redefining these values in every component, every time a specific font style is needed, there are utility classes available globally.

The full list of classes is available in the [typography file](../../lib/assets/css/_typography.pcss).

These classes MUST be used to ensure the typography is consistent across all components.

> [!TIP]
> Example:
>
> In the DS, a component needs to style its label with the "Body/regular-medium (default)".
>
> In the component, you can use typography classes like this:
>
> `<div class="typo-body-regular` />

## New CSS features support

We try to keep up to date with new CSS features and use them when they address a problem or specific integration use case.

As a rule of thumb, we use features that are _newly available_ in [Baseline](https://developer.mozilla.org/en-US/docs/Glossary/Baseline/Compatibility) for a year or more.

So be sure to check the [MDN documentation](https://developer.mozilla.org) and [Can I Use](https://caniuse.com) for the compatibility of the feature you want to use.

## CSS logical properties CAN be used to future-proof layouts

CSS logical properties ensure that direction-based properties (such as `margin`, `padding`, etc.) are handled correctly when the writing mode changes (e.g., from LTR to RTL).

So instead of using `margin-left: auto;` you can use `margin-inline-start: auto;`. This will ensure that the margin is applied to the correct side when the writing mode is switched.

See [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values) for more information.

## `:focus-visible` utility

Some components need to show a visual indication when they are in `:focus-visible` state (i.e., when navigating with keyboard).

As the style of the `:focus-visible` is the same across all components, but components don't have the same `border-radius`, it is not possible to simply rely on the `outline` property to achieve the correct styling.

So, a small utility can be used to add this style on the element that needs it:

```postcss
&:focus-visible {
  outline: none;

  &::before {
    content: '';
    position: absolute;
    inset: -0.4rem;
    border: 0.2rem solid var(--color-brand-txt-base);
    border-radius: 0.4rem;
  }
}
```

Then, you can tweak the `inset` property to get the desired result.
