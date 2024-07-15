<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('id').str().preset('550e8400-e29b-41d4-a716-446655440000').widget(),
      prop('copiableId').bool().widget(),
      slot().help('Meant to receive an ObjectLink component'),
      setting('slot').preset('Object link').widget(),
    ]"
  >
    <table>
      <tr>
        <CellObject v-bind="properties">
          {{ settings.slot }}
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
