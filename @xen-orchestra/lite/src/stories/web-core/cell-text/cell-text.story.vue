<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      slot().help('Meant to receive the main label'),
      slot('secondary').help('Meant to receive the secondary label'),
      setting('slot').preset('Primary label').widget(),
      setting('secondary').preset('Secondary label').widget(),
    ]"
  >
    <table>
      <tr>
        <CellText v-bind="properties">
          {{ settings.slot }}
          <template #secondary>{{ settings.secondary }}</template>
        </CellText>
      </tr>
    </table>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { setting, slot } from '@/libs/story/story-param'
import CellText from '@core/components/cell-text/CellText.vue'
</script>
