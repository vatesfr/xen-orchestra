# Icon System

A flexible icon system for Vue applications supporting single icons, icon stacks, icon packs, and transformations.

Currently supported icon format: FontAwesome, SimpleIcons

## Core Concepts

- **Icon**: A single SVG icon with transformations
- **Icon Stack**: Multiple icons layered on top of each other
- **Icon Pack**: A collection of related icons
- **Transformations**: Size, color, rotation, flip, and other visual modifications

## Usage

### Basic Icon

```vue
<template>
  <DisplayIconAny :icon="icon" />
</template>

<script lang="ts" setup>
import { defineIcon, DisplayIconAny } from '@core/packages/icon'
import { faUser } from '@fortawesome/free-solid-svg-icons'

const icon = defineIcon({
  icon: faUser,
  color: 'blue',
  size: 24,
})
</script>
```

### Icon Stack

```vue
<template>
  <DisplayIconAny :icon="stackedIcon" />
</template>

<script lang="ts" setup>
import { defineIcon, DisplayIconAny } from '@core/packages/icon'
import { faCircle, faStar } from '@fortawesome/free-solid-svg-icons'

const stackedIcon = defineIcon([
  { icon: faCircle, size: 24, color: 'blue' },
  { icon: faStar, size: 18, color: 'white' },
])
</script>
```

### Icon Pack

```vue
<template>
  <DisplayIconAny :icon="icons['user']" />
  <DisplayIconAny :icon="icons['star']" />
</template>

<script lang="ts" setup>
import { defineIconPack, DisplayIconAny } from '@core/packages/icon'
import { faUser, faStar } from '@fortawesome/free-solid-svg-icons'

const icons = defineIconPack({
  user: { icon: faUser, color: 'blue' },
  star: { icon: faStar, color: 'gold' },
})
</script>
```

### Icon Variants

```vue
<template>
  <DisplayIconAny :icon="alerts['error:circle']" />
  <DisplayIconAny :icon="alerts['warning:triangle']" />
</template>

<script lang="ts" setup>
import { defineIcon, DisplayIconAny } from '@core/packages/icon'
import { faCircle, faTriangle, faExclamation } from '@fortawesome/free-solid-svg-icons'

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
      circle: faCircle,
      triangle: defineIcon({ icon: faPlay, rotate: 90, size: 20 }),
    }

    return [
      { icon: shapes[shape], color: colors[status] },
      { icon: faExclamation, color: 'white' },
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

#### `DisplayIconAny`

Universal component that renders either a single icon or an icon stack.

```vue
<DisplayIconAny :icon="icon" />
```

#### `DisplayIconSingle`

Component for rendering a single icon.

```vue
<DisplayIconSingle :icon="icon" />
```

#### `DisplayIconStack`

Component for rendering an icon stack.

```vue
<DisplayIconStack :stack="stack" />
```

### Types

#### `IconTransforms`

Transformations that can be applied to icons.

```ts
type IconTransforms = {
  borderColor?: string // Add a border around the icon
  translate?: number | [number, number] // Move the icon
  size?: number | [number, number] // Resize the icon
  rotate?: number // Rotate the icon (in degrees)
  flip?: 'horizontal' | 'vertical' | 'both' // Flip the icon
  color?: string // Change icon color
}
```

#### `IconSingleConfig`

Configuration for a single icon.

```ts
type IconSingleConfig = {
  icon?: IconDefinition | SimpleIcon | IconSingle | IconStack
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
import { defineIcon, DisplayIconAny } from '@core/packages/icon'
import { faUser } from '@fortawesome/free-solid-svg-icons'

// Color
const blueIcon = defineIcon({ icon: faUser, color: 'blue' })

// Size
const largeIcon = defineIcon({ icon: faUser, size: 32 })

// Rotate
const rotatedIcon = defineIcon({ icon: faUser, rotate: 45 })

// Flip
const flippedIcon = defineIcon({ icon: faUser, flip: 'horizontal' })

// Multiple transformations
const customIcon = defineIcon({
  icon: faUser,
  color: 'green',
  size: 24,
  rotate: 15,
  translate: [2, 0],
})
</script>
```

### Complex Icon Stack

```vue
<script lang="ts" setup>
import { defineIcon, DisplayIconAny } from '@core/packages/icon'
import { faCircle, faSquare, faStar } from '@fortawesome/free-solid-svg-icons'

const notificationIcon = defineIcon(
  [
    { icon: faCircle, size: 24, color: 'red' },
    { icon: faSquare, size: 16, color: 'white', rotate: 45 },
    { icon: faStar, size: 10, color: 'gold' },
  ],
  { translate: [2, 0] } // Global transforms applied to the entire stack
)
</script>
```

### Icon Variants

```vue
<script lang="ts" setup>
const icon = defineIcon(
  [
    ['circle', 'square'],
    ['!', '?'],
  ],
  (shape, type) => [
    { icon: shape === 'circle' ? faCircle : faSquare },
    {
      icon: type === '!' ? faExclamation : faQuestion,
      color: 'white',
      size: 12,
    },
  ]
)

// You can now use icon['circle:!'], icon['circle:?'], icon['square:!'], icon['square:?']
</script>
```

### Icon Pack with Namespaces

```vue
<script lang="ts" setup>
import { defineIconPack, DisplayIconAny } from '@core/packages/icon'
import { faUser, faUsers, faUserPlus } from '@fortawesome/free-solid-svg-icons'
import { faFile, faFolder, faImage } from '@fortawesome/free-solid-svg-icons'

const icons = defineIconPack({
  user: defineIconPack({
    single: { icon: faUser },
    group: { icon: faUsers },
    add: { icon: faUserPlus },
  }),
  file: defineIconPack({
    document: { icon: faFile },
    folder: { icon: faFolder },
    image: { icon: faImage },
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
import { defineIcon, DisplayIconAny } from '@core/packages/icon'
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'

// Define base icon
const warningIcon = defineIcon({ icon: faExclamationTriangle })

// Create variations with different transformations
const smallWarningIcon = defineIcon({ icon: warningIcon, size: 12 })
const redWarningIcon = defineIcon({ icon: warningIcon, color: 'red' })
</script>
```
