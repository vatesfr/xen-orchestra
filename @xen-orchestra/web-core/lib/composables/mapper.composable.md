# `useMapper` composable

This composable maps values from one type to another using a mapping record. It takes a source value, a mapping object, and a default value to use when the source value is undefined or not found in the mapping.

## Usage

```ts
const mappedValue = useMapper(sourceValue, mapping, defaultValue)
```

|                | Required | Type                      | Default |                                                                                   |
| -------------- | :------: | ------------------------- | ------- | --------------------------------------------------------------------------------- |
| `sourceValue`  |    ✓     | `MaybeRefOrGetter<TFrom>` |         | The source value to be mapped. Can be a ref, a getter function, or a raw value    |
| `mapping`      |    ✓     | `Record<TFrom, TTo>`      |         | An object mapping source values to destination values                             |
| `defaultValue` |    ✓     | `MaybeRefOrGetter<TTo>`   |         | The default value to use when the source is undefined or not found in the mapping |

## Return value

|               | Type               |                                                  |
| ------------- | ------------------ | ------------------------------------------------ |
| `mappedValue` | `ComputedRef<TTo>` | A computed reference containing the mapped value |

## Example

```vue
<template>
  <div>
    <p>Selected car color: {{ carColor }}</p>
    <p>Recommended wall color: {{ wallColor }}</p>

    <button @click="carColor = 'red'">Red Car</button>
    <button @click="carColor = 'blue'">Blue Car</button>
    <button @click="carColor = 'black'">Black Car</button>
    <button @click="carColor = 'green'">Green Car</button>
    <button @click="carColor = 'silver'">Silver Car</button>
    <button @click="carColor = undefined">No Car</button>
  </div>
</template>

<script lang="ts" setup>
import { useMapper } from '@/composables/mapper'
import { ref } from 'vue'

// Source type
type CarColor = 'red' | 'blue' | 'black' | 'green' | 'silver'

// Destination type
type WallColor = 'beige' | 'lightGray' | 'cream' | 'white'

// Create a ref for the source value
const carColor = ref<CarColor | undefined>(undefined)

// Create a computed property that maps car color to wall color
const wallColor = useMapper<CarColor, WallColor>(
  carColor,
  {
    red: 'beige',
    blue: 'lightGray',
    black: 'cream',
    green: 'beige',
    silver: 'lightGray',
  },
  'white'
)
</script>
```

In this example:

- When `carColor.value` is `'red'` or `'green'`, `wallColor.value` will be `'beige'`
- When `carColor.value` is `'blue'` or `'silver'`, `wallColor.value` will be `'lightGray'`
- When `carColor.value` is `'black'`, `wallColor.value` will be `'cream'`
- When `carColor.value` is `undefined` or any value not in the mapping, `wallColor.value` will be
  `'white'` (the default value)
