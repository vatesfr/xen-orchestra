# Context Color

For more information about context, see the according documentation.

## Usage

```ts
const color = useColorContext();

console.log(color.name); // "success"
console.log(color.textClass); // "context-color-success"
console.log(color.backgroundClass); // "context-background-color-success"
console.log(color.borderClass); // "context-border-color-success"
```

## Update the context

You can pass a `MaybeRefOrGetter<Color>` as first argument to update the context value.

```ts
const props = defineProps<{
  color?: Color;
}>();

const color = useColorContext(() => props.color);
```
