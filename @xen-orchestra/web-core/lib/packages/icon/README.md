# Icon System

A flexible icon system for Vue applications supporting single icons, icon stacks, icon packs, and transformations.

In XO, raw SVG paths come from `@core/icons/kit.generated.ts` (see [docs/icons.md](../../../docs/icons.md)). Pack files in
`lib/icons/` wire those into named icons (`fa:plus`, `object:vm`, …) consumed by `VtsIcon`. The examples below import from
the kit directly; use icons that exist in your kit export.

## Core Concepts

- **Icon**: A single SVG icon with transformations
- **Icon Stack**: Multiple icons layered on top of each other
- **Icon Pack**: A collection of related icons
- **Transformations**: Size, color, rotation, flip, spin, and other visual modifications

## Usage

### Basic Icon

```vue
<template>
  <DisplayIcon :icon />
</template>

<script lang="ts" setup>
import { solid } from '@core/icons/kit.generated.ts'
import { defineIcon } from '@core/packages/icon'

const icon = defineIcon({
  icon: solid.faUserCircle,
  color: 'blue',
  size: 24,
})
</script>
```

### Icon Stack

```vue
<template>
  <DisplayIcon :icon="stackedIcon" />
</template>

<script lang="ts" setup>
import { solid } from '@core/icons/kit.generated.ts'
import { defineIcon } from '@core/packages/icon'

const stackedIcon = defineIcon([
  { icon: solid.faCircle, size: 24, color: 'blue' },
  { icon: solid.faStar, size: 18, color: 'white' },
])
</script>
```

### Icon Pack

```vue
<template>
  <DisplayIcon :icon="icons.user" />
  <DisplayIcon :icon="icons.star" />
</template>

<script lang="ts" setup>
import { solid } from '@core/icons/kit.generated.ts'
import { defineIconPack } from '@core/packages/icon'

const icons = defineIconPack({
  user: { icon: solid.faUserCircle, color: 'blue' },
  star: { icon: solid.faStar, color: 'gold' },
})
</script>
```

### Icon Variants

```vue
<template>
  <DisplayIcon :icon="alerts['error:triangle']" />
  <DisplayIcon :icon="alerts['warning:circle']" />
</template>

<script lang="ts" setup>
import { solid } from '@core/icons/kit.generated.ts'
import { defineIcon } from '@core/packages/icon'

const alerts = defineIcon(
  [
    ['error', 'warning'],
    ['circle', 'triangle'],
  ],
  (status, shape) => {
    const colors = {
      error: 'red',
      warning: 'orange',
    }

    const shapes = {
      circle: solid.faCircle,
      triangle: defineIcon({ icon: solid.faPlay, rotate: 90, size: 20 }),
    }

    return [
      { icon: shapes[shape], color: colors[status] },
      { icon: solid.faExclamation, color: 'white' },
    ]
  }
)
</script>
```

## API Reference

### Functions

#### `defineIcon`

Create a single icon, an icon stack, or an icon pack with variants.

**Signature 1: Single Icon or Icon Stack**

```ts
defineIcon(config: IconSingleConfig): Icon
defineIcon(icons: (IconSingleConfig | Icon)[], config?: IconStackConfig): IconStack
```

**Signature 2: Icon Variants**

```ts
defineIcon(
  args: string[][],
  builder: (...args: string[]) => DefineIconConfig,
  stackConfig?: IconStackConfig
): IconPack<string>
```

#### `defineIconPack`

Create a collection of related icons.

```ts
defineIconPack(config: IconPackConfig): IconPack<string>
```

### Components

#### `DisplayIcon`

Root component that renders either a single icon or an icon stack.

```vue
<DisplayIcon :icon />
```

### Types

#### `IconDefinition`

Minimal SVG data consumed by `normalizeIcon`. Usually taken from `kit.generated.ts`, not built by hand.

```ts
type IconDefinition = [width: number, height: number, path: string | string[]]
```

#### `IconTransforms`

Transformations that can be applied to icons.

```ts
type IconTransforms = {
  borderColor?: string // Add a border around the icon
  translate?: number | [number, number] // Move the icon
  size?: number | [number, number] // Resize the icon
  rotate?: number // Rotate the icon (in degrees)
  flip?: 'horizontal' | 'vertical' | 'both' // Flip the icon
  spin?: boolean | number // Spin animation (true or duration in seconds)
  color?: string // Change icon color
}
```

#### `IconSingleConfig`

Configuration for a single icon.

```ts
type IconSingleConfig = {
  icon?: IconDefinition | IconSingle | IconStack
} & IconTransforms
```

#### `IconStackConfig`

Configuration for an icon stack.

```ts
type IconStackConfig = IconTransforms
```

## Examples

### Basic Transformations

```vue
<script lang="ts" setup>
import { solid } from '@core/icons/kit.generated.ts'
import { defineIcon } from '@core/packages/icon'

// Color
const blueIcon = defineIcon({ icon: solid.faUserCircle, color: 'blue' })

// Size
const largeIcon = defineIcon({ icon: solid.faUserCircle, size: 32 })

// Rotate
const rotatedIcon = defineIcon({ icon: solid.faUserCircle, rotate: 45 })

// Flip
const flippedIcon = defineIcon({ icon: solid.faUserCircle, flip: 'horizontal' })

// Spin (`true` = 2s per rotation, or pass a duration in seconds)
const loadingIcon = defineIcon({ icon: solid.faSpinner, spin: true })
const slowSpinner = defineIcon({ icon: solid.faSpinner, spin: 4 })

// Multiple transformations
const customIcon = defineIcon({
  icon: solid.faUserCircle,
  color: 'green',
  size: 24,
  rotate: 15,
  translate: [2, 0],
})
</script>
```

In the app, `lib/icons/fa-icons.ts` registers the same pattern as `fa:spinner` (`spin: true`), used for example while a backup benchmark runs:

```vue
<VtsIcon :name="isBusy ? 'fa:spinner' : 'action:scan'" size="medium" />
```

### Complex Icon Stack

```vue
<script lang="ts" setup>
import { solid } from '@core/icons/kit.generated.ts'
import { defineIcon } from '@core/packages/icon'

const notificationIcon = defineIcon(
  [
    { icon: solid.faCircle, size: 24, color: 'red' },
    { icon: solid.faSquare, size: 16, color: 'white', rotate: 45 },
    { icon: solid.faStar, size: 10, color: 'gold' },
  ],
  { translate: [2, 0] } // Global transforms applied to the entire stack
)
</script>
```

### Icon Pack with Namespaces

```vue
<script lang="ts" setup>
import { regular, solid } from '@core/icons/kit.generated.ts'
import { defineIconPack } from '@core/packages/icon'

const icons = defineIconPack({
  user: defineIconPack({
    single: { icon: solid.faUserCircle },
    group: { icon: solid.faUsers },
    add: { icon: solid.faPlus },
  }),
  file: defineIconPack({
    document: { icon: regular.faFile },
    folder: { icon: regular.faFolderOpen },
    export: { icon: solid.faFileExport },
  }),
})

// Access icons with namespace
// icons['user:single']
// icons['file:folder']
</script>
```

### Reusable Icon with Different Transformations

```vue
<script lang="ts" setup>
import { solid } from '@core/icons/kit.generated.ts'
import { defineIcon } from '@core/packages/icon'

// Define base icon
const warningIcon = defineIcon({ icon: solid.faExclamationTriangle })

// Create variations with different transformations
const smallWarningIcon = defineIcon({ icon: warningIcon, size: 12 })
const redWarningIcon = defineIcon({ icon: warningIcon, color: 'red' })
</script>
```
