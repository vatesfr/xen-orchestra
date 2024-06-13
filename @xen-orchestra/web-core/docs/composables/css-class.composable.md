# `useCssClass` composable

## Introduction

The `useCssClass` composable is a utility function that generates CSS classes based on the props of a component.

```ts
useCssClass(baseClass, { props, variants, customVariants, extraClasses })
```

The first argument is the base class name, which will be added as-is and be used as a prefix for all generated classes.

The second argument is an object with the following properties:

- `props`: The props of the component.
- `variants`: An array of prop names, or groups of prop names, specifying which props to use for generating variant class names.
- `customVariants`: An optional list of custom classes that will be prefixed with `<base-class>--x-`.
- `extraClasses`: Optional extra classes to add "as-is" to the component.

## `variants` property

The `variants` property is an array of prop names, or groups of prop names, specifying which props to use for generating variant class names.

For each item, the generated class will be `<base-class>--<prop-value>` (or `<base-class>--<prop-name>_<0|1>` if the prop is a `boolean`).

If an item is an array, the generated class will be `<base-class>--<prop1-value>--<prop2-value>` (same exception as above for `boolean` props).

### Example

```ts
const className = useCssClass('vts-comp', {
  props: { color: 'blue', size: 'medium', active: false },
  variants: ['color', 'size', ['color', 'size'], ['color', 'active']],
})
```

The generated classes will be:

- `vts-comp`
- `vts-comp--blue`
- `vts-comp--medium`
- `vts-comp--blue--medium`
- `vts-comp--blue--active_0`

## `customVariants` property

The `customVariants` property is an optional list of custom classes that will be prefixed with `<base-class>--x-`.

It accepts the same arguments as Vue `class` binding.

### Example

```ts
const className = useCssClass('vts-comp', {
  customVariants: () => ['foo', { bar: true }],
})
```

The generated classes will be:

- `vts-comp`
- `vts-comp--x-foo`
- `vts-comp--x-bar`

## `extraClasses` property

The `extraClasses` property is an optional list of extra classes to add "as-is" to the component.

It accepts the same arguments as Vue `class` binding.

### Example

```ts
const className = useCssClass('vts-comp', {
  extraClasses: () => 'some-global-class'
})
```

The generated classes will be:

- `vts-comp`
- `some-global-class`
