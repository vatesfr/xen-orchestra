<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      slot().help('Meant to receive VtsButton components'),
      slot('tertiary').help('Meant to receive a third VtsButton component, it will be on a second row'),
    ]"
  >
    <ButtonGroup v-bind="properties">
      <VtsButton level="secondary" color="normal" size="medium">Cancel</VtsButton>
      <VtsButton level="primary" color="normal" size="medium">Call to action</VtsButton>
      <template #tertiary>
        <VtsButton level="tertiary" color="warning" size="medium">Secondary call to action</VtsButton>
      </template>
    </ButtonGroup>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { slot } from '@/libs/story/story-param'
import ButtonGroup from '@core/components/button/ButtonGroup.vue'
import VtsButton from '@core/components/button/VtsButton.vue'
</script>
