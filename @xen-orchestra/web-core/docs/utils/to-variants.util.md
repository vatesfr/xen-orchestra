# toVariants utility

This utility is used to convert a set of props into a list of CSS variants classes.

- No class will be added for other _falsy_ values
- `<key>` class will be added for `true` values
- `<key>--<value>` class will be added for other values

## Basic usage

```ts
const props = defineProps<{
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
then `variants` will be `['color--blue', 'size--small']`.

## Advanced usage

Variants don't have to be based on props, you can define them the way you want.

Thanks to the way Vue works, they can also be mixed with other classes.

```ts
const props = defineProps<{
  label: string
  color: 'blue' | 'red'
  size: 'small' | 'large'
}>()

const isDisabled = inject('isParentDisabled', ref(false))

const classes = computed(() => [
  'vts-my-component',
  'typo',
  props.size === 'small' ? 'p3-regular' : 'p2-medium',
  { disabled: isDisabled.value },
  toVariants({
    color: props.color,
    size: props.size.slice(0, 1),
    state: isDisabled.value ? 'off' : 'on',
  }),
])
```

`classes` applied to the component will then look like `vts-my-component typo p3-regular disabled color-blue size-s state-off`
