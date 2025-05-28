# Mapper System

A system for mapping values from one type to another with support for reactive sources.

## Core Concepts

- **Mapping**: A structure that defines transformations from a source type to a destination type
- **Source**: The value to be transformed, which can be reactive
- **Default Source**: A fallback value to use when the source is undefined or not found in the mapping

## Usage

### `useMapper` Composable

```typescript
const mappedValue = useMapper(sourceValue, mapping, defaultValue)
```

|                | Required | Type                      | Description                                                        |
| -------------- | :------: | ------------------------- | ------------------------------------------------------------------ |
| `sourceValue`  |    ✓     | `MaybeRefOrGetter<TFrom>` | The source value to be mapped (ref, getter function, or raw value) |
| `mapping`      |    ✓     | `Mapping<TFrom, TTo>`     | The mapping between source and destination values                  |
| `defaultValue` |    ✓     | `MaybeRefOrGetter<TFrom>` | Default source value to use when source is undefined/not found     |

#### Return Value

|               | Type               | Description                                   |
| ------------- | ------------------ | --------------------------------------------- |
| `mappedValue` | `ComputedRef<TTo>` | A computed reference of the transformed value |

### `createMapper` Function

Creates a reusable mapper function from a mapping configuration.

```typescript
const getValueFor = createMapper(mapping, defaultValue)
const mappedValue = getValueFor(sourceValue)
```

|                | Required | Type                                    | Description                                          |
| -------------- | :------: | --------------------------------------- | ---------------------------------------------------- |
| `mapping`      |    ✓     | `MaybeRefOrGetter<Mapping<TFrom, TTo>>` | The mapping between source and destination values    |
| `defaultValue` |    ✓     | `MaybeRefOrGetter<TFrom>`               | Default source value to use when source is undefined |

#### Return Value

|          | Type                     | Description                                            |
| -------- | ------------------------ | ------------------------------------------------------ |
| `mapper` | `(source: TFrom) => TTo` | Function that maps a source value to destination value |

## Mapping Types

The `mapping` parameter supports several formats:

1. **Object Literal**: For when `TFrom` extends `PropertyKey` (string, number, or symbol)

   ```typescript
   const mapping = {
     red: 'crimson',
     blue: 'navy',
     green: 'forest',
   }
   ```

2. **Map Instance**: For complex or non-serializable source keys

   ```typescript
   const mapping = new Map([
     [ADMIN_SYMBOL, { level: 3, canEdit: true }],
     [EDITOR_SYMBOL, { level: 2, canEdit: true }],
     [VIEWER_SYMBOL, { level: 1, canEdit: false }],
   ])
   ```

3. **Tuple Array**: For boolean or enum values
   ```typescript
   const mapping = [
     [true, 'Active'],
     [false, 'Inactive'],
     [undefined, 'Unknown'],
   ]
   ```

## Basic Example

```vue
<template>
  <div>
    <div>Current status: {{ status }}</div>
    <div>Status color: {{ statusColor }}</div>

    <button @click="status = 'success'">Success</button>
    <button @click="status = 'error'">Error</button>
    <button @click="status = 'warning'">Warning</button>
    <button @click="status = 'info'">Info</button>
    <button @click="status = 'foobar'">Unknown</button>
    <button @click="status = undefined">Reset</button>
  </div>
</template>

<script lang="ts" setup>
import { useMapper } from '@core/packages/mapper/use-mapper.ts'
import { ref } from 'vue'

type Status = 'success' | 'error' | 'warning' | 'info'

const status = ref<Status | undefined>(undefined)

const statusColor = useMapper(
  status,
  {
    success: 'green',
    error: 'red',
    warning: 'orange',
    info: 'blue',
  },
  'info' // Default source value when status is undefined or not found
)
</script>
```

## Reactive Mapping

Both the source value and the mapping object can be reactive:

```vue
<template>
  <div>
    <div>Current status: {{ deviceStatusText }}</div>

    <button type="button" @click="deviceStatus = 'yes'">Yes</button>
    <button type="button" @click="deviceStatus = 'no'">No</button>

    <div>
      <button type="button" @click="currentMapping = 1 - currentMapping">Toggle mapping</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useMapper } from '@core/packages/mapper/use-mapper.ts'
import { computed, ref } from 'vue'

const deviceStatus = ref('online')

const mappings = [
  {
    yes: 'Yes',
    no: 'No',
  },
  {
    yes: 'Yep!',
    no: 'Nope!',
  },
]

const currentMapping = ref(0)

// If the mapping changes, the computed result will update
const deviceStatusText = useMapper(
  deviceStatus,
  computed(() => mappings[currentMapping.value]),
  'no'
)
</script>
```
