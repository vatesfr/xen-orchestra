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
    <UiButton variant="primary" size="medium" accent="info" @click="toggle()">Toggle</UiButton>
    <UiSidePanel v-bind="properties" :error="properties.error">
      <template #header>
        <UiButton variant="tertiary" size="medium" accent="info" :left-icon="faEdit"> {{ settings.action1 }}</UiButton>
        <UiButton variant="tertiary" size="medium" accent="danger" :left-icon="faTrash">
          {{ settings.action2 }}
        </UiButton>
      </template>
      <VtsLoadingHero type="card" :disabled="isReady">
        <UiCard v-if="!properties.error">
          <div>Content 1</div>
          <div>Content 1</div>
          <div>Content 1</div>
        </UiCard>
      </VtsLoadingHero>
    </UiSidePanel>
  </ComponentStory>
</template>

<script setup lang="ts">
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiSidePanel from '@core/components/ui/panel/UiPanel.vue'
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons'
import { useToggle } from '@vueuse/core'
import { computed } from 'vue'

const [isToggled, toggle] = useToggle()
const isReady = computed(() => isToggled.value)
</script>
