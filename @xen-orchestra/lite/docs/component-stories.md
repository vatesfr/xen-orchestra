<!-- TOC -->

- [Component Stories](#component-stories)
  - [How to create a story](#how-to-create-a-story)
  - [How to write a story](#how-to-write-a-story)
  - [Example](#example)
  - [Props](#props)
    - [Basic prop configuration](#basic-prop-configuration)
    - [Required prop](#required-prop)
    - [Prop type](#prop-type)
    - [Prop widget](#prop-widget)
    - [Prop default](#prop-default)
    - [Prop preset](#prop-preset)
    - [Prop help](#prop-help)
  - [Events](#events)
    - [Basic event configuration](#basic-event-configuration)
    - [Event with no arguments](#event-with-no-arguments)
    - [Event with arguments](#event-with-arguments)
    - [Custom event handler](#custom-event-handler)
    - [Event help](#event-help)
  - [Models](#models)
    - [Basic model configuration](#basic-model-configuration)
    - [Model configuration](#model-configuration)
  - [Slots](#slots)
    - [Basic slot configuration](#basic-slot-configuration)
    - [Named slot](#named-slot)
    - [Scoped slot (slot with props)](#scoped-slot--slot-with-props-)
    - [Slot help](#slot-help)
  - [Settings](#settings)
    - [Basic settings configuration](#basic-settings-configuration)
    - [Settings with widgets](#settings-with-widgets)
    - [Settings help](#settings-help)
    - [Using settings in your template](#using-settings-in-your-template)
  - [Presets](#presets) - [Basic presets configuration](#basic-presets-configuration) - [Example: Progress component presets](#example-progress-component-presets) - [Example: State-based presets](#example-state-based-presets) - [Example: Presets with settings](#example-presets-with-settings) - [Best practices for presets](#best-practices-for-presets) - [Preset naming conventions](#preset-naming-conventions)
  <!-- TOC -->

# Component Stories

The `ComponentStory` component allows you to document your components and their props, events and slots.

Use the `useStory` composable to define your story configuration. It returns `params`, `bindings`, and `settings` objects.

You can configure props, events, models, slots and settings.

Props, Events and Models will be available in the `bindings` object.

Slots are only for documentation purpose.

Settings will be available in the `settings` object.

## How to create a story

1. Create a new story component in the `src/stories` directory (ie. `my-component.story.vue`).
2. To document your component, create the same file with the `.md` extension (ie. `my-component.story.md`).

## How to write a story

In your `.story.vue` file, import and use the `ComponentStory` component with the `useStory` composable.

```vue
<template>
  <ComponentStory :params>
    <MyComponent v-bind="bindings">
      {{ settings.label }}
    </MyComponent>
  </ComponentStory>
</template>

<script lang="ts" setup>
import MyComponent from '@/components/MyComponent.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings, settings } = useStory({
  props: {
    // prop configurations
  },
  models: {
    // model configurations
  },
  events: {
    // event configurations
  },
  slots: {
    // slot configurations
  },
  settings: {
    // setting configurations
  },
})
</script>
```

### Example

Let's take this Vue component:

```vue
<template>
  <div>
    <div>Required string prop: {{ imString }}</div>
    <div>Required number prop: {{ imNumber }}</div>
    <div v-if="imOptional">Optional prop: {{ imOptional }}</div>
    <div>Optional prop with default: {{ imOptionalWithDefault }}</div>
    <button @click="handleClick">Click me</button>
    <button @click="handleClickWithArg('some-id')">Click me with an id</button>
    <div>
      <slot />
    </div>
    <div>
      <slot name="named-slot" />
    </div>
    <div>
      <slot :moon-distance="moonDistance" name="named-scoped-slot" />
    </div>
  </div>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    imString: string
    imNumber: number
    imOptional?: string
    imOptionalWithDefault?: string
    modelValue?: string
    customModel?: number
  }>(),
  { imOptionalWithDefault: 'Hi World' }
)

const emit = defineEmits<{
  click: []
  clickWithArg: [id: string]
  'update:modelValue': [value: string]
  'update:customModel': [value: number]
}>()

const moonDistance = 384400

const handleClick = () => emit('click')
const handleClickWithArg = (id: string) => emit('clickWithArg', id)
</script>
```

Here is how to document it with a Component Story:

```vue
<template>
  <ComponentStory :params :presets>
    <MyComponent v-bind="bindings">
      {{ settings.contentExample }}
      <template #named-slot>Named slot content</template>
      <template #named-scoped-slot="{ moonDistance }"> Moon distance is {{ moonDistance }} meters. </template>
    </MyComponent>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import MyComponent from '@/components/MyComponent.vue'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings, settings } = useStory({
  props: {
    imString: {
      preset: 'Example',
      required: true,
      help: 'This is a required string prop',
    },
    imNumber: {
      preset: 42,
      required: true,
      help: 'This is a required number prop',
    },
    imOptional: {
      preset: ref<string>(),
      type: 'string',
      help: 'This is an optional string prop',
    },
    imOptionalWithDefault: {
      preset: ref<string>(),
      default: 'Hi World',
    },
  },
  models: {
    modelValue: {
      preset: ref<string>(),
      type: 'string',
    },
    customModel: {
      preset: ref<number>(),
      type: 'number',
    },
  },
  events: {
    click: { help: 'Emitted when the user clicks the first button' },
    clickWithArg: {
      args: { id: 'string' },
      help: 'Emitted when the user clicks the second button',
    },
  },
  slots: {
    default: { help: 'This is the default slot' },
    'named-slot': { help: 'This is a named slot' },
    'named-scoped-slot': {
      help: 'This is a named slot',
      props: { moonDistance: 'number' },
    },
  },
  settings: {
    contentExample: { preset: 'Some content' },
  },
})

const presets: Record<string, () => void> = {
  'Demo preset': () => {
    bindings.imString = 'Text from preset'
    bindings.imNumber = 1000
    settings.contentExample = 'Preset content for default slot'
  },
  'Another example': () => {
    bindings.imString = 'Another example'
    bindings.imNumber = 500
    bindings.imOptional = 'Optional value set by preset'
  },
}
</script>
```

### Props

Props are defined in the `props` object passed to `useStory()`. Each prop is configured with an object containing various options.

Props will appear on the **Props** tab and be available in the `bindings` object.

#### Basic prop configuration

```ts
const { bindings } = useStory({
  props: {
    title: {
      preset: 'My Title',
      required: true,
      help: 'The title of the component',
    },
  },
})
```

#### Required prop

Set `required: true` to mark a prop as required.

```ts
title: {
  preset: 'My Title',
  required: true,
}
```

#### Prop type

Set the `type` property to specify the prop type. The type can also be detected automatically from the preset value.

```ts
// Explicit type
title: {
  preset: ref<string>(),
  type: 'string',
}

// Auto-detected from preset
count: {
  preset: 42, // automatically detected as number
}
```

#### Prop widget

Set `widget: true` to automatically detect the widget, or `widget: false` to disable it.

```ts
title: {
  preset: 'My Title',
  widget: true,
}
```

#### Prop default

Set the `default` property to document the default value of the prop.

```ts
color: {
  preset: ref<string>(),
  default: 'blue',
}
```

#### Prop preset

The `preset` property sets the initial value for the prop in the story. Use `ref()` for reactive values.

```ts
// Static preset
title: {
  preset: 'Static Title',
}

// Reactive preset
title: {
  preset: ref<string>(),
}
```

#### Prop help

Set the `help` property to add help text for the prop.

```ts
color: {
  preset: 'red',
  help: 'This is the component text color',
}
```

### Events

Events are defined in the `events` object passed to `useStory()`. Each event is configured with an object containing various options.

Events will appear in the **Events** tab and be automatically bound to your component in the `bindings` object.

When triggered, events will be logged to the `Logs` card.

#### Basic event configuration

```ts
const { bindings } = useStory({
  events: {
    click: { help: 'Emitted when the user clicks the button' },
  },
})
```

#### Event with no arguments

```ts
events: {
  edit: { help: 'Emitted when edit is triggered' },
}
```

#### Event with arguments

```ts
events: {
  delete: {
    args: { id: 'string' },
    help: 'Emitted when delete is triggered',
  },
}
```

#### Custom event handler

You can provide a custom handler function for an event.

```ts
const debug = (id: string) => console.log(id)

events: {
  myEvent: {
    args: { id: 'string' },
    handler: debug,
    help: 'Custom event with handler',
  },
}
```

#### Event help

Set the `help` property to add help text for the event.

```ts
events: {
  close: {
    help: 'Called when user clicks the close icon or on the background',
  },
}
```

### Models

Models are defined in the `models` object passed to `useStory()`. Each model creates both a prop and an event handler.

Models will appear in the **Props** tab and be available in the `bindings` object with their corresponding update handlers.

#### Basic model configuration

```ts
const { bindings } = useStory({
  models: {
    modelValue: {
      preset: ref<string>(),
      type: 'string',
    },
  },
})
```

#### Model configuration

Models accept the same configuration options as props:

```ts
models: {
  value: {
    preset: ref<string>(),
    type: 'string',
    required: true,
    help: 'The current value of the component',
  },
}
```

### Slots

Slots are defined in the `slots` object passed to `useStory()`. Each slot is configured with an object containing various options.

Slots are only for documentation purposes and will appear in the **Slots** tab.

#### Basic slot configuration

```ts
const {} = useStory({
  slots: {
    default: { help: 'This is the default slot' },
  },
})
```

#### Named slot

```ts
slots: {
  header: { help: 'This is the header slot' },
}
```

#### Scoped slot (slot with props)

```ts
slots: {
  footer: {
    help: 'This is the footer slot',
    props: { color: 'string', count: 'number' },
  },
}
```

#### Slot help

Set the `help` property to add help text for the slot.

```ts
slots: {
  footer: {
    help: 'This is the footer slot',
  },
}
```

### Settings

Settings are defined in the `settings` object passed to `useStory()`. Each setting is configured with an object containing various options.

Settings are not passed automatically to your component, but you can access them in your template with the `settings` object.

#### Basic settings configuration

```ts
const { settings } = useStory({
  settings: {
    label: { preset: 'My Label' },
  },
})
```

#### Settings with widgets

```ts
import { text, choice, number, boolean, object } from '@core/packages/story/story-widget.ts'

const { settings } = useStory({
  settings: {
    label: {
      preset: 'My Label',
      widget: text(),
    },
    count: {
      preset: 5,
      widget: number(),
    },
    enabled: {
      preset: true,
      widget: boolean(),
    },
    variant: {
      preset: 'primary',
      widget: choice('primary', 'secondary', 'tertiary'),
    },
  },
})
```

#### Available widget types

The story system provides several widget types:

- `text()` - Text input
- `number()` - Number input
- `boolean()` - Checkbox
- `choice(...options)` - Dropdown select
- `choice(...options).radio()` - Radio buttons
- `object()` - Object editor

#### Special widgets

For advanced use cases, you can use specialized widgets:

```ts
import { iconChoice } from '@core/packages/story/story-param.ts'
import { choice } from '@core/packages/story/story-widget.ts'

// Icon picker widget
leftIcon: {
  preset: ref<IconDefinition>(),
  type: 'IconDefinition',
  widget: iconChoice(),
}

// Choice widget as radio buttons
variant: {
  preset: 'primary',
  widget: choice('primary', 'secondary', 'tertiary').radio(),
}
```

#### Settings help

Set the `help` property to add help text for the setting.

```ts
settings: {
  label: {
    preset: 'My Label',
    help: 'The label text to display',
  },
}
```

#### Using settings in your template

```vue
<template>
  <ComponentStory :params>
    <button>{{ settings.label }}</button>
  </ComponentStory>
</template>
```

### Presets

Presets allow you to define predefined configurations that users can quickly switch between in the UI. They appear as a dropdown menu in the story interface.

#### Basic presets configuration

```ts
const { params, bindings, settings } = useStory({
  // ... your story configuration
})

const presets: Record<string, () => void> = {
  'Preset Name': () => {
    bindings.propName = 'preset value'
    settings.settingName = 'preset setting value'
  },
}
```

Then pass the presets to the ComponentStory:

```vue
<template>
  <ComponentStory :params :presets>
    <MyComponent v-bind="bindings" />
  </ComponentStory>
</template>
```

#### Example: Progress component presets

```ts
const presets: Record<string, () => void> = {
  'Half of 500': () => {
    bindings.maxValue = 500
    bindings.value = 250
  },
  '75% of 300': () => {
    bindings.maxValue = 300
    bindings.value = 225
  },
  'Warning >= 80%': () => {
    bindings.maxValue = 100
    bindings.value = 85
    bindings.accent = 'warning'
  },
}
```

#### Example: State-based presets

```ts
const presets: Record<string, () => void> = {
  'First page': () => {
    bindings.from = 1
    bindings.to = 50
    bindings.isFirstPage = true
    bindings.isLastPage = false
  },
  'Last page': () => {
    bindings.from = 101
    bindings.to = 137
    bindings.isFirstPage = false
    bindings.isLastPage = true
  },
  'Middle page': () => {
    bindings.from = 51
    bindings.to = 100
    bindings.isFirstPage = false
    bindings.isLastPage = false
  },
}
```

#### Example: Presets with settings

```ts
const presets: Record<string, () => void> = {
  'Demo configuration': () => {
    // Update component props
    bindings.title = 'Demo Title'
    bindings.variant = 'primary'

    // Update story settings
    settings.slotContent = 'Demo content'
    settings.showAdvanced = true
  },
}
```

#### Best practices for presets

1. **Use descriptive names** that clearly explain what the preset demonstrates
2. **Show realistic scenarios** that users might encounter in production
3. **Include edge cases** like error states, empty states, or boundary conditions
4. **Group related properties** together to create coherent scenarios
5. **Demonstrate different component states** (loading, error, success, etc.)

#### Preset naming conventions

- Use clear, descriptive names: `'Warning >= 80%'` instead of `'Preset 1'`
- Include relevant values: `'Half of 500'` instead of `'Medium'`
- Describe the scenario: `'First page'` instead of `'Page state'`
- Use realistic examples: `'Running VM'` instead of `'Green state'`
