<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('error').bool().widget(),
      setting('action1').widget(text()).preset('Edit'),
      setting('action2').widget(text()).preset('Delete'),
      slot(),
      slot('header').help('Meant to receive UiButton or other information'),
    ]"
    :presets="{
      Normal: {
        props: {
          error: false,
        },
      },
      Error: {
        props: {
          error: true,
        },
      },
    }"
  >
    <UiSidePanel v-bind="properties" :error="properties.error">
      <template #header>
        <UiButton variant="tertiary" size="medium" accent="brand" @click="toggle()">Toggle</UiButton>
        <UiButton variant="tertiary" size="medium" accent="brand" left-icon="fa:edit"> {{ settings.action1 }}</UiButton>
        <UiButton variant="tertiary" size="medium" accent="danger" left-icon="fa:trash">
          {{ settings.action2 }}
        </UiButton>
      </template>
      <VtsStateHero v-if="!isReady" format="card" type="busy" size="medium" />
      <UiCard v-else-if="!properties.error">
        <div>Content 1</div>
        <div>Content 1</div>
        <div>Content 1</div>
      </UiCard>
    </UiSidePanel>
  </ComponentStory>
</template>

<script setup lang="ts">
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiSidePanel from '@core/components/ui/panel/UiPanel.vue'
import { useToggle } from '@vueuse/core'
import { computed } from 'vue'

const [isToggled, toggle] = useToggle()
const isReady = computed(() => isToggled.value)
</script>
