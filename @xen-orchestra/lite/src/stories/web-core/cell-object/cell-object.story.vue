<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('copyId').bool().widget(),
      slot().help('Meant to receive an ObjectLink component'),
      slot('id').help('Meant to receive the object ID'),
      setting('slot').preset('Object link').widget(),
      setting('id').preset('550e8400-e29b-41d4-a716-446655440000').widget(),
    ]"
  >
    <table>
      <tr>
        <CellObject v-bind="properties">
          {{ settings.slot }}
          <template #id>{{ settings.id }}</template>
        </CellObject>
      </tr>
    </table>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import CellObject from '@core/components/cell-object/CellObject.vue'
</script>
