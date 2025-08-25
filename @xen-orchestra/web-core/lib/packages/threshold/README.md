# `useThreshold`

`useThreshold` composable allows defining payloads for different thresholds.

It returns the payload of the highest matching threshold for that value.

## Arguments

| Argument       | Type                                                                 | Required | Description                           |
| -------------- | -------------------------------------------------------------------- | :------: | ------------------------------------- |
| `currentValue` | `MaybeRefOrGetter<number>`                                           |    ✓     | The value to check against thresholds |
| `config`       | `MaybeRefOrGetter<Record<number, TPayload> & { default: TPayload }>` |    ✓     | The thresholds configuration          |

## Returns

`ComputedRef<{ value: number | undefined; payload: TPayload }>`

## Example

```ts
const threshold = useThreshold(value, {
  50: 'orange',
  100: 'red',
  default: 'green',
})

// value = 20 → threshold = { value: undefined, payload: 'green' }
// value = 70 → threshold = { value: 50, payload: 'orange' }
// value = 130 → threshold = { value: 100, payload: 'red' }
```
