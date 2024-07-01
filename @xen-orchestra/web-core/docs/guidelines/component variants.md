# Component variants

In this guide we'll see how to manage the different variants of a component, such as size, color, etc.

Throughout this guide, we'll use the example of a button component as it is probably the most complex component in terms of variants.

## Identifying variants

First, we need to identify the variants of a component.

For that, check its different versions in the Design System.

For example, for the Button component, we can see the following variants:

- A **level** variant (primary, secondary, tertiary)
- A **color** variant (blue, green, orange, red)
- A **size** variant (small, medium, large)
- A **state** variant (normal, hover, pressed, disabled)

The first three will be defined via `props` (`level`, `color` and `size`), while the last will be defined via CSS pseudo-classes (`:hover`, `:active`, `:disabled`).

## Defining the `props`

The `props` will be typed according to the possible values for each variant.

For example, for buttons, we'll have the following `props`:

```ts
defineProps<{
  level: 'primary' | 'secondary' | 'tertiary'
  color: 'info' | 'success' | 'warning' | 'danger'
  size: 'small' | 'medium' | 'large'
}>()
```

> [!WARNING]
> It's important to note that the same value can **not** be accepted in multiple variants.
>
> For example, if `level` accepts the values `primary`, `secondary` and `tertiary`, then it will not be possible to have a color accepting a `primary` value too.

## Naming CSS variables

CSS variables are used to store the values of CSS properties modified by the different variants.

Their names will respect different formats depending on their use:

- `--<base-class>--<property>` for variables intended for use in implementation
- `--<base-class>__<element-class>--<property>` for variables intended for use in a sub-element
- `--<base-class>--x-<any>` for transient variables (defined in one variant, but used in another)

## Identifying style changes

Next, we need to identify what changes, according to the different variants.

1. We can see that the accent color (whether used as background, text and/or border color) changes, according to the `color` and `state` variants.

   As we don't know in advance which CSS properties this color will be applied to, we'll use a transient variable to store it:

   - `--vts-button--x-accent-color`

2. We can also see that the background, text and/or border color (based on the previously defined `--vts-button--x-accent-color` variable) change according to the `level` variant.

   We'll then use the following CSS variables:

   - `--vts-button--background-color`
   - `--vts-button--border-color`
   - `--vts-button--color`

3. Next, we can see that `padding` and `gap` vary according to the `level` and `size` variant.

   We'll use the following CSS variables:

   - `--vts-button--padding`
   - `--vts-button--gap`

4. Finally, we can see that the `border-style` and `border-radius` vary according to the `level` variant.
   We'll use the following CSS variables:

   - `--vts-button--border-style`
   - `--vts-button--border-radius`

## Variant groups

Based on the previous point, we can identify three variant groups associated with the CSS properties they modify:

- `color` + state :
  - `--vts-button--x-accent-color`
- `level` :
  - `--vts-button--background-color`
  - `--vts-button--border-color`
  - `--vts-button--color`
  - `--vts-button--border-style`
  - `--vts-button--border-radius`
- `level` + `size` :
  - `--vts-button--padding`
  - `--vts-button--gap`

## Generate CSS classes

The component's root element must contain a base CSS class, as well as a set of classes reflecting the component's different variants of the component.

The base class will follow the format `vts-<component-name>`.

The variant classes will follow the format `vts-<component-name>--<variant-value-1>-<variant-value-2>-<...>`.

> [!NOTE]
> For legibility, an exception is made for `boolean` props.
>
> In this case, the class name will be `vts-<component-name>--<prop-name>_<0 | 1>`.

Based on the variant groups identified above, we'll need to generate the following CSS classes:

- `vts-button--<color>` (states will be managed via CSS pseudo-classes)
- `vts-button--<level>`
- `vts-button--<level>--<size>`

For example, for a **secondary level**, **green color** and **medium size** button, the following CSS classes should be applied:

- `vts-button`
- `vts-button--success`
- `vts-button--secondary`
- `vts-button--secondary--medium`

## `useCssClass` composable

The `useCssClass` composable makes it easy to generate these CSS classes based on the `props` passed to the component.

```ts
const className = useCssClass('vts-button', {
  props,
  variants: ['color', 'level', ['level', 'size']],
})
```

See [useCssClass](../composables/css-class.composable.md) for full documentation.

##

## Writing CSS styles

The component's CSS styles must be written using the CSS classes and variables mentioned above.

Let's start with the basic implementation:

```postcss
/* IMPLEMENTATION */
.vts-button {
  cursor: pointer;
  border-width: 1px;
  background-color: var(--vts-button--background-color);
  border-color: var(--vts-button--border-color);
  color: var(--vts-button--color);
  padding: var(--vts-button--padding);
  gap: var(--vts-button--gap);
  border-style: var(--vts-button--border-style);
  border-radius: var(--vts-button--border-radius);
}
```

Then prepare the different variants previously identified, above the basic implementation:

```postcss
/*
COLOR + STATE
--vts-button--x-accent-color
*/
.vts-button {
}

/*
LEVEL
--vts-button--background-color
--vts-button--border-color
--vts-button--color
--vts-button--border-style
--vts-button--border-radius
*/
.vts-button {
}

/*
LEVEL + SIZE
--vts-button--padding
--vts-button--gap
*/
.vts-button {
}

/* IMPLEMENTATION */
.vts-button {
  /* ... */
}
```

Finally, we can implement them:

```postcss
/*
COLOR + STATE
--vts-button--x-accent-color
*/
.vts-button {
  &--info {
    --vts-button--x-accent-color: var(--color-purple-base);
  }

  &--info:hover {
    --vts-button--x-accent-color: var(--color-purple-d20);
  }

  &--info:active {
    --vts-button--x-accent-color: var(--color-purple-d40);
  }

  &--info:disabled {
    --vts-button--x-accent-color: var(--color-grey-400);
  }

  &--success {
    --vts-button--x-accent-color: var(--color-green-base);
  }

  &--success:hover {
    --vts-button--x-accent-color: var(--color-green-d20);
  }

  &--success:active {
    --vts-button--x-accent-color: var(--color-green-d40);
  }

  &--success:disabled {
    --vts-button--x-accent-color: var(--color-green-l60);
  }

  &--warning {
    --vts-button--x-accent-color: var(--color-orange-base);
  }

  &--warning:hover {
    --vts-button--x-accent-color: var(--color-orange-d20);
  }

  &--warning:active {
    --vts-button--x-accent-color: var(--color-orange-d40);
  }

  &--warning:disabled {
    --vts-button--x-accent-color: var(--color-orange-l60);
  }

  &--danger {
    --vts-button--x-accent-color: var(--color-red-base);
  }

  &--danger:hover {
    --vts-button--x-accent-color: var(--color-red-d20);
  }

  &--danger:active {
    --vts-button--x-accent-color: var(--color-red-d40);
  }

  &--danger:disabled {
    --vts-button--x-accent-color: var(--color-red-l60);
  }
}

/*
LEVEL
--vts-button--background-color
--vts-button--border-color
--vts-button--color
--vts-button--border-style
--vts-button--border-radius
*/
.vts-button {
  &--primary {
    --vts-button--background-color: var(--vts-button--x-accent-color);
    --vts-button--border-color: var(--vts-button--x-accent-color);
    --vts-button--color: var(--color-grey-600);
    --vts-button--border-style: solid;
    --vts-button--border-radius: 0.8rem;
  }

  &--secondary {
    --vts-button--background-color: var(--background-color-primary);
    --vts-button--border-color: var(--vts-button--x-accent-color);
    --vts-button--color: var(--vts-button--x-accent-color);
    --vts-button--border-style: solid;
    --vts-button--border-radius: 0.8rem;
  }

  &--tertiary {
    --vts-button--background-color: transparent;
    --vts-button--border-color: var(--vts-button--x-accent-color);
    --vts-button--color: var(--vts-button--x-accent-color);
    --vts-button--border-style: none none solid;
    --vts-button--border-radius: 0;
  }
}

/*
LEVEL + SIZE
--vts-button--padding
--vts-button--gap
*/
.vts-button {
  &--primary--small,
  &--secondary--small {
    --vts-button--padding: 0.4rem 0.8rem;
    --vts-button--gap: 0.8rem;
  }

  &--primary--medium,
  &--secondary--medium {
    --vts-button--padding: 0.8rem 1.6rem;
    --vts-button--gap: 1.6rem;
  }

  &--primary--large,
  &--secondary--large {
    --vts-button--padding: 1.6rem 2.4rem;
    --vts-button--gap: 2.4rem;
  }

  &--tertiary--small {
    --vts-button--padding: 0;
    --vts-button--gap: 0.8rem;
  }

  &--tertiary--medium {
    --vts-button--padding: 0.2rem 0;
    --vts-button--gap: 0.8rem;
  }

  &--tertiary--large {
    --vts-button--padding: 0.4rem 0;
    --vts-button--gap: 1.6rem;
  }
}

/* IMPLEMENTATION */
.vts-button {
  cursor: pointer;
  border-width: 1px;
  background-color: var(--vts-button--background-color);
  border-color: var(--vts-button--border-color);
  color: var(--vts-button--color);
  padding: var(--vts-button--padding);
  gap: var(--vts-button--gap);
  border-style: var(--vts-button--border-style);
  border-radius: var(--vts-button--border-radius);
}
```
