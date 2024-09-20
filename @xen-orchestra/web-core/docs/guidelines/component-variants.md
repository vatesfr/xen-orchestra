# Component Variants

A variant is a specific style that a component can have. It is usually determined by the value of a prop.

These variants are defined in the Design System and are reflected in the component's CSS.

See also:
[toVariants utility](../utils/to-variants.util.md) to help you generate variant CSS classes for your components.

## Base class

The root element of a component will have a specific CSS class following the pattern `vts-<component-name>`.

> [!TIP]
> Example:
>
> The class for a "Button" component would be `vts-button`.

## Variant classes

The root element will then have secondary classes which reflect the current variants being applied.

The pattern for these classes is `<prop-name>--<prop-value>` (or `<prop-name>` for `true` boolean).

> [!TIP]
> Example:
>
> If `color` prop is `success` and `size` prop is `medium` then the classes `color--success` and `size--medium`
> would be applied to the root element.

## Converting Design System props into Vue props

The first step will be to convert the Design System's props into Vue props.

Some are easy to map, like `color` or `size`, which have a specific list of possible values.

But others are more tricky, like a `state` prop in the Design System having values like `default`, `hover`, `active`, or
`disabled`.

We can't simply create a `state` prop in Vue with these values (it wouldn't make sense for "hover" and "active" states).

So in this case:

- the "default" state would be represented as "no class applied."
- the "hover" and "active" states would be represented as `:hover` and `:active` pseudo-classes.
- the "disabled" state would be represented as a `disabled` `boolean` prop which would add a `disabled` class when `true`.

## CSS variables

Each CSS property that can be affected by a variant should have a corresponding CSS variable.

The format for these variables is `--<base-class>--<property-name>`.

> [!TIP]
> Example:
>
> For a `VtsButton` component, the CSS variables could be `--vts-button--background-color`, or `--vts-button--padding`.

### CSS variables for child elements

If the CSS property to be changed is owned by a child element, the variable name should reflect that.

The format for these variables is `--<base-class>__<child-class>--<property-name>`.

> [!TIP]
> Example:
>
> If we need to change `color` of a `.icon` inside our `VtsButton` component, the CSS variable will be
> `--vts-button__icon--color`.

## Identifying which DS props affect which CSS variables

The next step is to identify which CSS variables will be affected by each DS prop.

For example, we could imagine:

- a `color` prop affecting the `background-color`, `color`, and `border-color` properties.
- a "state" affecting the `background-color` property.
- a `size` prop affecting the `padding`, `gap`, and `font-size` properties.
- a `level` prop affecting the `color` and `padding` properties.

## Grouping CSS variables declarations

Once we know which CSS variables will be affected by each prop, we can group them accordingly.

From the previous example, we can see that:

- `border-color` is affected by `color` only.
- `gap` and `font-size` are affected by `size` only.
- `background-color` is affected by both "state" and `color`.
- `color` is affected by both `color` and `level`.
- `padding` is affected by both `size` and `level`

So we could prepare our variables groups like this:

```postcss
/*
COLOR
--vts-button--border-color
*/
.vts-button {
  /* We'll define the border-color here */
}

/*
SIZE
--vts-button--gap
--vts-button--font-size
*/
.vts-button {
  /* We'll define the gap and font-size here */
}

/*
COLOR + STATE
--vts-button--background-color
*/
.vts-button {
  /* We'll define the background-color here */
}

/*
COLOR + LEVEL
--vts-button--color
*/
.vts-button {
  /* We'll define the color here */
}

/*
SIZE + LEVEL
--vts-button--padding
*/
.vts-button {
  /* We'll define the padding here */
}
```

## Filling the groups

Lastly, we can now fill in the CSS variables accordingly.

Let's start with the `COLOR` group:

```postcss
/*
COLOR
--vts-button--border-color
*/
.vts-button {
  &.color--blue {
    --vts-button--border-color: blue;
  }

  &.color--red {
    --vts-button--border-color: red;
  }
}
```

Then the `SIZE` group:

```postcss
/*
SIZE
--vts-button--gap
--vts-button--font-size
*/
.vts-button {
  &.size--small {
    --vts-button--gap: 0.5rem;
    --vts-button--font-size: 0.75rem;
  }

  &.size--medium {
    --vts-button--gap: 1rem;
    --vts-button--font-size: 1rem;
  }
}
```

Let's continue with the `COLOR + STATE` group:

```postcss
/*
COLOR + STATE
--vts-button--background-color
*/
.vts-button {
  &.color--blue {
    & {
      /* default state */
      --vts-button--background-color: blue;
    }

    &:hover {
      --vts-button--background-color: skyblue;
    }

    &:active {
      --vts-button--background-color: darkblue;
    }

    &:disabled {
      --vts-button--background-color: aliceblue;
    }
  }

  &.color--red {
    & {
      /* default state */
      --vts-button--background-color: red;
    }

    &:hover {
      --vts-button--background-color: salmon;
    }

    &:active {
      --vts-button--background-color: darkred;
    }

    &:disabled {
      --vts-button--background-color: lightpink;
    }
  }
}
```

Moving on to the `COLOR + LEVEL` group:

```postcss
/*
COLOR + LEVEL
--vts-button--color
*/
.vts-button {
  &.color--blue {
    &.level--primary {
      --vts-button--color: blue;
    }

    &.level--secondary {
      --vts-button--color: lightblue;
    }
  }

  &.color--red {
    &.level--primary {
      --vts-button--color: red;
    }

    &.level--secondary {
      --vts-button--color: lightcoral;
    }
  }
}
```

And finally, the `SIZE + LEVEL` group:

```postcss
/*
SIZE + LEVEL
--vts-button--padding
*/
.vts-button {
  &.size--small {
    &.level--primary {
      --vts-button--padding: 0.25rem 0.5rem;
    }

    &.level--secondary {
      --vts-button--padding: 0.5rem 1rem;
    }
  }

  &.size--medium {
    &.level--primary {
      --vts-button--padding: 0.5rem 1rem;
    }

    &.level--secondary {
      --vts-button--padding: 1rem 2rem;
    }
  }
}
```

## Implementing the component base CSS

Now that we have our CSS variables defined, we can implement the base CSS for our component.

```postcss
/* ... variables definitions ... */

/* IMPLEMENTATION */
.vts-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 0.1rem solid var(--vts-button--border-color);
  gap: var(--vts-button--gap);
  font-size: var(--vts-button--font-size);
  padding: var(--vts-button--padding);
  background-color: var(--vts-button--background-color);
  color: var(--vts-button--color);
}
```
