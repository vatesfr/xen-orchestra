<template>
  <ComponentStory
    v-slot="{ settings }"
    :params="[
      slot('title').help('Optional, shown above the alert'),
      slot().help('The text of the success alert'),
      slot('actions').help('The links and buttons that follow the success, centred'),
      setting('titleSlot').preset('Connected to 192.168.1.1').widget(),
      setting('defaultSlot').preset('The pool is connected.').widget(),
    ]"
  >
    <VtsSuccessStateHero>
      <template v-if="settings.titleSlot" #title>{{ settings.titleSlot }}</template>
      {{ settings.defaultSlot }}
      <template #actions>
        <UiButton accent="brand" variant="secondary" size="medium">Continue</UiButton>
      </template>
    </VtsSuccessStateHero>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { setting, slot } from '@/libs/story/story-param.ts'
import VtsSuccessStateHero from '@core/components/success-state-hero/VtsSuccessStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
</script>
