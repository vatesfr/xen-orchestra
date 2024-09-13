# toVariants utility

This utility is used to convert a set of props into a list of CSS variants classes.

- No class will be added for _falsy_ values
- `<key>` class will be added for a value which is explicitly `true`
- `<key>--<value>` class will be added for other values

For example :

```ts
defineProps<{
  color: 'blue' | 'red'
  size: 'small' | 'large'
  disabled?: boolean
}>()

const variants = computed(() => toVariants(props))
```

If `color` is `'blue'` and `size` is `'small'`, then `variants` will be `['color--blue', 'size--small']`.

Additionally, if `disabled` is `true`, `variants` will be `['color--blue', 'size--small', 'disabled']`.

## Select a subset of props

All your props are not necessarily variants.

In this case, you can specify which props you want to convert to class, thanks to the second argument:

```ts
defineProps<{
  label: string
  color: 'blue' | 'red'
  size: 'small' | 'large'
}>()

const variants = computed(() => toVariants(props, ['color', 'size']))
```

## Custom variant

If you want to use a custom variant, you can pass a custom value as the first argument:

```ts
defineProps<{
  color: 'blue' | 'red'
  size: 'small' | 'large'
  disabled?: boolean
}>()

const variants = computed(() =>
  toVariants({
    color: props.color,
    size: props.size,
    state: props.disabled ? 'off' : 'on',
  })
)
```

`variants` will be `['color--blue', 'size--small', 'state--on']` or `['color--blue', 'size--small', 'state--off']`.
