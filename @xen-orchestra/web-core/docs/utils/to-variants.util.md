# toVariants utility

This utility is used to convert a set of props into a list of CSS variants classes.

- `<key>--0` class will be added for `false` values
- `<key>--1` class will be added for `true` values
- No class will be added for other _falsy_ values
- `<key>--<value>` class will be added for other values

For example :

```ts
defineProps<{
  label: string
  color: 'blue' | 'red'
  size: 'small' | 'large'
  disabled?: boolean
}>()

const variants = computed(() =>
  toVariants({
    color: props.color,
    size: props.size,
    disabled: props.disabled,
  })
)
```

If `color` is `'blue'`, `size` is `'small'`, and `disabled` is `false`,
then `variants` will be `['color--blue', 'size--small', 'disabled--0']`.

> [!TIP]
> You can obviously define your own variants, based or not on props.

```ts
defineProps<{
  color: 'blue' | 'red'
  size: 'small' | 'large'
}>()

const isDisabled = inject(IK_DISABLED, ref(false))

const variants = computed(() =>
  toVariants({
    color: props.color,
    size: props.size,
    state: isDisabled.value ? 'off' : 'on',
  })
)
```

Then if `isDisabled` is `true`, then `variants` will be `['color--blue', 'size--small', 'state--off']`,
else it will be `['color--blue', 'size--small', 'state--on']`.
