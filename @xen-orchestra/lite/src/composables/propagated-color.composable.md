# Propagated Color

For more information about propagated props, see the according documentation.

## Usage

```ts
const color = usePropagatedColor();

console.log(color.name); // "success"
console.log(color.textClass); // "propagated-color-success"
console.log(color.bgClass); // "propagated-background-color-success"
```

## Change and propagate the color

```ts
const props = defineProps<{
  color?: Color;
}>();

const color = usePropagatedColor(() => props.color);
```
