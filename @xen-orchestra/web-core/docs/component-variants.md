# Component Variants

A variant is a specific style that a component can have. It is usually determined by the value of a prop.

These variants are defined in the Design System and are reflected in the component's CSS.

See also:
[toVariants utility](../lib/utils/to-variants.util.md) to help you generate variant CSS classes for your components.

Component props that affect the variant MUST be specified in the component's `defineProps()`. They also MUST be **required**.

> [!TIP]
> Example:
>
> The `accent` and `variant` props for a "Button" component are required and must be specified when using the component:
>
> ```vue
> <template>
>   <Button accent="info" variant="primary">Label</Button>
> </template>
> ```

## Base class

The root element of a component will have a specific CSS class following the pattern `ui-<component-name>` if the component is part of the DS, or `vts-<component-name>` if it's a _web-core_ component shared between XO 6 and XO Lite.

> [!TIP]
> Example:
>
> The class for a DS "Button" component would be `ui-button`.

## Variant classes

The root element will then have secondary classes which reflect the current variants being applied.

The pattern for these classes is `<prop-name>--<prop-value>` (or `<prop-name>` for `true` boolean).

> [!TIP]
> Example:
>
> If `accent` prop is `success` and `size` prop is `medium` then the classes `accent--success` and `size--medium`
> would be applied to the root element.

## Converting Design System props into Vue props

The first step will be to convert the Design System's props into Vue props.

Some are easy to map, like `accent` or `size`, which have a specific list of possible values. See [the list below](#ds-props-and-vue-props-list) for the full list of values.

But others are more tricky, like an `interaction` prop in the Design System having values like `default`, `hover`, `active`, or `disabled`.

We can't simply create an `interaction` prop in Vue with these values (it wouldn't make sense for "hover" and "active" states).

So in this case:

- the "default" interaction would be represented as "no class applied."
- the "hover" and "active" interactions would be represented as `:hover` and `:active` pseudo-classes.
- the "disabled" interaction would be represented as a `disabled` `boolean` prop which would add a `muted` or `disabled` class when `true` (depending on if the component can have an HTML `disabled` attribute or not).

### DS props and Vue props list

Here is the list of all possible values for each DS prop and Vue props:

- `accent`:
  - `brand`
  - `info`
  - `neutral`
  - `success`
  - `warning`
  - `danger`
  - `muted`
- `size`:
  - `small`
  - `medium`
  - `large`
- `variant`:
  - `primary`
  - `secondary`
  - `tertiary`

## How to define variants' props

First, we need to find in the DS, which values each prop can have.

For example, imagine a "Button" component that can have three variants (`primary`, `secondary` and `tertiary`), four different accent colors (`info`, `success`, `warning` and `danger`), three sizes (`small`, `medium`, `large`) and can be `disabled`.

Since we use TypeScript, it's best practice to type the variants' props.

### Component variants typing

We can start by creating the TypeScript types that these props will take.

To keep things related, the typing can be done directly inside the `script` section of the component.

Example for a "Button" component:

```ts
type ButtonVariant = 'primary' | 'secondary' | 'tertiary'
type ButtonAccent = 'info' | 'success' | 'warning' | 'danger'
type ButtonSize = 'small' | 'medium' | 'large'
```

There is no need to create a type for the `disabled` interaction, as it only a simple `boolean` and the type can be specified directly in `defineProps()`.

### Define props

Then, we can define the props needed to handle the variants:

```ts
// TS types here

const props = defineProps<{
  variant: ButtonVariant
  accent: ButtonAccent
  size: ButtonSize
  disabled?: boolean
}>()
```

## How to define variants' CSS classes using the `toVariants()` helper

Given the props we defined above, and to match the class names convention, we can define the classes with the `toVariants()` helper.

A way to do it is as follows:

```ts
const classNames = computed(() => [
  toVariants({
    variant: props.variant,
    accent: props.accent,
    size: props.size,
    disabled: props.disabled,
  }),
])
```

Let's take an example where we want to use the "Button" component with this DS variant:

```
variant: primary
accent: info
size: medium
disabled: true
```

By using the helper, the following classes would be generated, and be ready to use in the `template` section of the component:

`variant--primary accent--info size--medium disabled`

> [!TIP]
> Example:
>
> This code:
>
> `<button :class="classNames" />`
>
> will be rendered as:
>
> `<button class="variant--primary accent--info size--medium disabled" />`

The next step is to implement the CSS part for these classes.

## How to implement variants

### Start with the base styles for the component

Start with the base styles for the component, and any styles not affected by the variants.

```postcss
.ui-button {
  display: flex;
  gap: 1rem;
  /* Other base styles */
}
```

Because of the way we handle variants, there is no concept of a "default" variant for DS components. Since the variants' props are required, we know that the "default" variant will always be defined, and in fact, we don't need to think about which variant should be the "default" one.

### Then add the variants' styles

There is no specific order, but generally the question that might help to decide is: "Which CSS property is affected by what?"

Example: the `background-color` CSS property of a "Button" component is affected by its interaction state, which is different depending on the `variant` and `accent` props.

So, in this case, the implementation could look something like:

```postcss
.ui-button {
  /* Base styles */

  /* ACCENT + VARIANT */

  &.accent--info {
    &.variant--primary {
      background-color: var(--color-info-item-base); /* Default style for this variant */

      &:hover {
        background-color: var(--color-info-item-hover);
      }

      &:active {
        background-color: var(--color-info-item-active);
      }

      &:is(:disabled, .disabled) {
        background-color: var(--color-info-item-disabled);
      }
    }

    &.variant--secondary {
      background-color: var(--color-neutral-background-primary);

      &:hover {
        background-color: var(--color-neutral-background-primary);
      }

      &:active {
        background-color: var(--color-neutral-background-primary);
      }

      &:is(:disabled, .disabled) {
        background-color: var(--color-neutral-background-disabled);
      }
    }

    &.variant--tertiary {
      background-color: transparent;

      &:hover {
        background-color: var(--color-info-background-hover);
      }

      &:active {
        background-color: var(--color-info-background-active);
      }

      &:is(:disabled, .disabled) {
        background-color: transparent;
      }
    }
  }
}
```

A comment can be used to provide more separation between base styles and variant styles (e.g. `/* ACCENT + VARIANT */`).

The same structure can be applied for the other `accent` variants, like `success`, `warning` etc.

Then, if the "Button" has different sizes, which depend on the `size` prop:

```postcss
.ui-button {
  /* Base styles */

  /* ACCENT + VARIANT */
  /* ... */

  /* SIZE */

  &.size--small {
    padding: 0.4rem 0.8rem;
  }

  &.size--medium {
    padding: 0.8rem 1.6rem;
  }

  &.size--large {
    padding: 1.6rem 2.4rem;
  }
}
```

Applying this structure for each variant in the components will allow keeping consistency across the project.
