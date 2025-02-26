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
