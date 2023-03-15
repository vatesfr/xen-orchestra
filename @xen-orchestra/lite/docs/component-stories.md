<!-- TOC -->

- [Component Stories](#component-stories)
  - [How to create a story](#how-to-create-a-story)
  - [How to write a story](#how-to-write-a-story)
  _ [Example](#example)
  _ [Props](#props)
  _ [Required prop](#required-prop)
  _ [Prop type](#prop-type)
  _ [String](#string)
  _ [Number](#number)
  _ [Boolean](#boolean)
  _ [Array](#array)
  _ [Object](#object)
  _ [Enum](#enum)
  _ [Any](#any)
  _ [Custom type](#custom-type)
  _ [Prop widget](#prop-widget)
  _ [Text](#text)
  _ [Number](#number-1)
  _ [Object](#object-1)
  _ [Choice](#choice)
  _ [Boolean](#boolean-1)
  _ [Prop default](#prop-default)
  _ [Prop preset](#prop-preset)
  _ [Prop help](#prop-help)
  _ [Events](#events)
  _ [Event with no arguments](#event-with-no-arguments)
  _ [Event with arguments](#event-with-arguments)
  _ [Custom function](#custom-function)
  _ [Event type](#event-type)
  _ [Models](#models)
  _ [Default model](#default-model)
  _ [Custom model](#custom-model)
  _ [Configure the underlying prop and event](#configure-the-underlying-prop-and-event)
  _ [Model type](#model-type)
  _ [Model help](#model-help)
  _ [Slots](#slots)
  _ [Default slot](#default-slot)
  _ [Named slot](#named-slot)
  _ [Scoped slot (slot with props)](#scoped-slot--slot-with-props-)
  _ [Slot help](#slot-help)
  _ [Settings](#settings)
  <!-- TOC -->

# Component Stories

The `ComponentStory` component allows you to document your components and their props, events and slots.

It takes a `params` prop which is an array of configuration items.

You can configure props, events, models, slots and settings.

Props, Events and Models will be added to the `properties` slot prop.

Slots are only for documentation purpose.

Settings will be added to the `settings` slot prop.

## How to create a story

1. Create a new story component in the `src/stories` directory (ie. `my-component.story.vue`).
2. To document your component, create the same file with the `.md` extension (ie. `my-component.story.md`).

## How to write a story

In your `.story.vue` file, import and use the `ComponentStory` component.

```vue
<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop(...),
      event(...),
      model(...),
      slot(...),
      setting(...),
    ]"
  >
    <MyComponent v-bind="properties">
      {{ settings.label }}
    </MyComponent>
  </ComponentStory>
</template>

<script lang="ts" setup>
import MyComponent from "@/components/MyComponent.vue";
import ComponentStory from "@/components/component-story/ComponentStory.vue";
import { prop, event, model, slot, setting } from "@/libs/story/story-param";
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
    imString: string;
    imNumber: number;
    imOptional?: string;
    imOptionalWithDefault?: string;
    modelValue?: string;
    customModel?: number;
  }>(),
  { imOptionalWithDefault: "Hi World" }
);

const emit = defineEmits<{
  (event: "click"): void;
  (event: "clickWithArg", id: string): void;
  (event: "update:modelValue", value: string): void;
  (event: "update:customModel", value: number): void;
}>();

const moonDistance = 384400;

const handleClick = () => emit("click");
const handleClickWithArg = (id: string) => emit("clickWithArg", id);
</script>
```

Here is how to document it with a Component Story:

```vue
<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('imString')
        .str()
        .required()
        .preset('Example')
        .widget()
        .help('This is a required string prop'),
      prop('imNumber')
        .num()
        .required()
        .preset(42)
        .widget()
        .help('This is a required number prop'),
      prop('imOptional').str().widget().help('This is an optional string prop'),
      prop('imOptionalWithDefault')
        .str()
        .default('Hi World')
        .widget()
        .default('My default value'),
      model().prop((p) => p.str()),
      model('customModel').prop((p) => p.num()),
      event('click').help('Emitted when the user clicks the first button'),
      event('clickWithArg')
        .args({ id: 'string' })
        .help('Emitted when the user clicks the second button'),
      slot().help('This is the default slot'),
      slot('namedSlot').help('This is a named slot'),
      slot('namedScopedSlot')
        .prop('moon-distance', 'number')
        .help('This is a named slot'),
      setting('contentExample').widget(text()).preset('Some content'),
    ]"
  >
    <MyComponent v-bind="properties">
      {{ settings.contentExample }}
      <template #named-slot>Named slot content</template>
      <template #named-scoped-slot="{ moonDistance }">
        Moon distance is {{ moonDistance }} meters.
      </template>
    </MyComponent>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from "@/components/component-story/ComponentStory.vue";
import MyComponent from "@/components/MyComponent.vue";
import { event, model, prop, setting, slot } from "@/libs/story/story-param";
import { text } from "@/libs/story/story-widget";
</script>
```

### Props

Use the `prop(name: string)` function to document a prop.

It will appear on the **Props** tab.

#### Required prop

If the prop is required, use the `required()` function.

`prop('title').required()`

#### Prop type

You can set the type of the prop with the `str()`, `num()`, `bool()`, `arr()`, `obj()`, `enum()` and `any()` functions.

The type can also be detected automatically if a [preset](#prop-preset) value is defined.

##### String

`prop('title').str()`: `string`

##### Number

`prop('count').num()`: `number`

##### Boolean

`prop('disabled').bool()`: `boolean`

##### Array

`prop('items').arr()`: `any[]`

`prop('items').arr('string')`: `string[]`

##### Object

`prop('user').obj()`: `object`

`prop('user').obj('{ name: string, age: number }')`: `{ name: string; age: number; }`

##### Enum

`prop('color').enum('red', 'green', 'blue')`: `"red" | "green" | "blue"`

##### Any

`prop('color').any()`: `any`

##### Custom type

`prop('user').type('User')`: `User`

#### Prop widget

When the prop type is defined, the widget is automatically detected.

`prop('title').str().widget()`

But you can also define the widget manually.

##### Text

`prop('...').widget(text())`

##### Number

`prop('...').widget(number())`

##### Object

`prop('...').widget(object())`

##### Choice

`prop('...').widget(choice('red', 'green', 'blue'))`

##### Boolean

`prop('title').widget(boolean())`

#### Prop default

This documents the default value of the prop, which is applied when the prop is not defined.

`prop('color').default('blue')`

#### Prop preset

This allows to preset a prop value for this story.

`prop('color').preset('red')`

#### Prop help

This allows to add a help text for this prop.

`prop('color').help('This is the component text color')`

### Events

Use the `event(name: string)` function to document an event.

It will appear in the **Events** tab.

When triggered, this event will be logged to the `Logs` card.

#### Event with no arguments

`event('edit')`: `() => void`

#### Event with arguments

`event('delete').args({ id: 'string' })`: `(id: string) => void`

#### Custom function

If needed, thanks to the `preset` method, you can attach a custom function to your event.

`const debug = (id: string) => console.log(id);`

`event('my-event').args({ id: 'string' }).preset(debug)`

#### Event type

The event type is automatically generated from the arguments.

You can override it with the `type()` method.

#### Event help

This allows to add a help text for this event.

`event('close').help('Called when user clicks the close icon or on the background')`

### Models

Use the `model(name = "model-value")` function to document a model.

Calling `model("foo")` is kind of equivalent to calling `prop("foo")` + `event("update:foo")`.

#### Default model

`model()` with no argument will create a `model-value` prop and a `update:model-value` event.

#### Custom model

`model('foo')` will create a `foo` prop and a `update:foo` event.

#### Configure the underlying prop and event

You can use `.prop((p) => ...)` and `.event((e) => ...)` methods to access the underlying prop and event respectively
then use any of the [prop](#props) and [event](#events) methods.

`model().event((e) => e.help('Help for update:modelValue event'))`

#### Model type

`.type(type: string)` function is a shortcut for `.prop((p) => p.type(...))`

#### Model help

Using `.help(text: string)` function is a shortcut for `.prop((p) => p.help(...))`

### Slots

Use the `slot(name = "default")` function to document a slot.

#### Default slot

`slot()`

=> `<slot />`

#### Named slot

`slot('header')`

=> `<slot name="header" />`

#### Scoped slot (slot with props)

`slot('footer').prop('color', 'string').prop('count', 'number')`

#### Slot help

`slot('footer').help('This is the footer slot')`

### Settings

Use the `setting(name: string)` to configure your Story with arbitrary settings.

They will not be passed automatically to your component, but you can access them in your template with the `settings` variable.

For example:

```vue
<template>
  <ComponentStory v-slot="{ settings }" :params="[setting('label').widget()]">
    <button>{{ settings.label }}</button>
  </ComponentStory>
</template>
```
