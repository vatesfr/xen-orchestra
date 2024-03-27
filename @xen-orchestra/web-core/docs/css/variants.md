# Variants

To effectively manage CSS variants, it's recommended to use CSS custom properties.

Begin by defining the properties that will be modified by the variants.

When possible, maintain consistency by using identical names for both the variable and the property.

Moreover, organizing variants by category (such as colors, sizes, etc.) and annotating them with comments can enhance
code readability and facilitate code folding.

```postcss
/* COLOR VARIANTS */
.my-component {
  &.info {
    --color: var(--color-purple-base);
  }

  &.success {
    --color: var(--color-green-base);
  }
}

/* SIZE VARIANTS */
.my-component {
  &.small {
    --font-size: 1rem;
  }

  &.medium {
    --font-size: 1.6rem;
  }

  &.large {
    --font-size: 2.4rem;
  }
}

/* IMPLEMENTATION */
.my-component {
  color: var(--color);
  font-size: var(--font-size);
}
```

## Explicit variants

When possible, define all variants explicitly, including the default one.

This approach ensures that the CSS is more intelligible, simpler to maintain, and easier to troubleshoot.

❌ **Bad**

```postcss
/* COLOR VARIANTS */
.my-component {
  .success {
    --color: var(--color-green-base);
  }
}

/* SIZE VARIANTS */
.my-component {
  .small {
    --font-size: 1rem;
  }

  .large {
    --font-size: 2.4rem;
  }
}

.my-component {
  color: var(--color, var(--color-purple-base));
  font-size: var(--font-size, 1.6rem);
}
```

If you need a default property when no specific class is applied, define it at the top of the selector.

✅ **Good**

```postcss
/* COLOR VARIANTS */
.my-component {
  --color: var(--color-purple-base);

  &.free {
    --color: var(--color-green-base);
  }
}

/* IMPLEMENTATION */
.my-component {
  color: var(--color);
}
```

When dealing with multiple default properties, or nested variants, you can group them in a `& {}` block to
enhance readability.

✅ **Good**

```postcss
/* COLOR VARIANTS */
.my-component {
  & {
    --color: var(--color-purple-base);
    --background-color: var(--background-color-purple-10);
    --border-color: var(--color-purple-d20);
  }

  &.free {
    --color: var(--color-green-base);
    --background-color: var(--background-color-green-10);
    --border-color: var(--color-green-d20);
  }
}

/* IMPLEMENTATION */
.my-component {
  color: var(--color);
}
```

## Sub-variants

For scenarios requiring the variants of variants (such as different colors based on different sizes), use nested
selectors.

Rule of thumb: the parent selector should be "what is modified," and the child selector should be "who is modifying."

For example, in the case of colors based on sizes, "what is modified" is the color, and "who is modifying" is the size.

So the parent selector should be the color modifier, and the child selector should be the size modifier.

As before, grouping variants by type and annotating them enhances maintainability and readability.

```postcss
/* COLOR VARIANTS */
.my-component {
  &.info {
    &.small {
      --color: var(--color-purple-base);
    }

    &.medium {
      --color: var(--color-purple-l20);
    }

    &.large {
      --color: var(--color-purple-l40);
    }
  }

  &.success {
    &.small {
      --color: var(--color-green-base);
    }

    &.medium {
      --color: var(--color-green-l20);
    }

    &.large {
      --color: var(--color-green-l40);
    }
  }
}

/* SIZE VARIANTS */
.my-component {
  &.small {
    --font-size: 1rem;
  }

  &.medium {
    --font-size: 1.6rem;
  }

  &.large {
    --font-size: 2.4rem;
  }
}

/* IMPLEMENTATION */
.my-component {
  color: var(--color);
  font-size: var(--font-size);
}
```

### Keep structure coherence

Ensure the parent selector corresponds to the variant category (colors, sizes, etc.) to maintain logical structure and
coherence.

In the following example, the variant is the color, so the font size should not be used as the parent selector:

❌ **Bad**

```postcss
.my-component {
  .small {
    .info {
      --color: var(--color-purple-base);
    }

    .success {
      --color: var(--color-green-base);
    }
  }

  .medium {
    .info {
      --color: var(--color-purple-l20);
    }

    .success {
      --color: var(--color-green-l20);
    }
  }

  .large {
    .info {
      --color: var(--color-purple-l40);
    }

    .success {
      --color: var(--color-green-l40);
    }
  }
}
```

But if the variant is the font size, then it should be used as the parent selector:

✅ **Good**

```postcss
.my-component {
  .small {
    .info {
      --font-size: 1rem;
    }

    .success {
      --font-size: 1.6rem;
    }
  }

  .medium {
    .info {
      --font-size: 1.6rem;
    }

    .success {
      --font-size: 2.4rem;
    }
  }

  .large {
    .info {
      --font-size: 2.4rem;
    }

    .success {
      --font-size: 1rem;
    }
  }
}
```

### Avoid mixing different variant types

Mixing different variant types within the same selector is discouraged as it complicates the code structure and
readability.

❌ **Bad**

```postcss
.my-component {
  &.small {
    --font-size: 1rem;

    &.info {
      --color: var(--color-purple-base);
    }

    &.success {
      --color: var(--color-green-base);
    }
  }

  &.medium {
    --font-size: 1.6rem;

    &.info {
      --color: var(--color-purple-l20);
    }

    &.success {
      --color: var(--color-green-l20);
    }
  }

  &.large {
    --font-size: 2.4rem;

    &.info {
      --color: var(--color-purple-l40);
    }

    &.success {
      --color: var(--color-green-l40);
    }
  }

  color: var(--color);
  font-size: var(--font-size);
}
```
