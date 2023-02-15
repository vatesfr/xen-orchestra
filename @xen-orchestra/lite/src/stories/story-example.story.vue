<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :presets="presets"
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
      event('click').help('Emitted when the user click the first button'),
      event('clickWithArg')
        .args({ id: 'string' })
        .help('Emitted when the user click the second button'),
      slot().help('This is the default slot'),
      slot('named-slot').help('This is a named slot'),
      slot('named-scoped-slot')
        .prop('moon-distance', 'number')
        .help('This is a named slot'),
      setting('defaultSlotContent')
        .widget(text())
        .preset('Content for default slot'),
      setting('namedSlotContent')
        .widget(text())
        .preset('Content for named slot'),
      setting('namedScopedSlotContent')
        .widget(text())
        .preset('Content for named scoped slot'),
    ]"
  >
    <StoryExampleComponent
      v-bind="properties"
      v-model="defaultModel"
      v-model:customModel="customModel"
    >
      {{ settings.defaultSlotContent }}
      <div>Default model value: {{ defaultModel }}</div>
      <div>Custom model value: {{ customModel }}</div>
      <template #named-slot>
        {{ settings.namedSlotContent }}
      </template>
      <template #named-scoped-slot="{ moonDistance }">
        {{ settings.namedScopedSlotContent }} (scope value: {{ moonDistance }})
      </template>
    </StoryExampleComponent>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from "@/components/component-story/ComponentStory.vue";
import StoryExampleComponent from "@/components/component-story/StoryExampleComponent.vue";
import { event, model, prop, setting, slot } from "@/libs/story/story-param";
import { text } from "@/libs/story/story-widget";
import { ref } from "vue";

const defaultModel = ref("");
const customModel = ref("");

const presets: Record<
  string,
  {
    props?: Record<string, any>;
    settings?: Record<string, any>;
  }
> = {
  "Demo preset": {
    props: {
      imString: "Text from preset",
      imNumber: 1000,
    },
    settings: {
      defaultSlotContent: "Preset content for default slot",
      namedSlotContent: "Preset content for named slot",
      namedScopedSlotContent: "Preset content for named scoped slot",
    },
  },
};
</script>
