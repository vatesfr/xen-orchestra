<template>
  <ComponentStory :params>
    <table>
      <tbody>
        <tr>
          <VtsCellObject v-bind="bindings">
            {{ settings.slot }}
          </VtsCellObject>
        </tr>
      </tbody>
    </table>
  </ComponentStory>
</template>

<script lang="ts" setup>
import VtsCellObject from '@core/components/cell-object/VtsCellObject.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings, settings } = useStory({
  props: {
    id: {
      preset: '550e8400-e29b-41d4-a716-446655440000',
    },
    copiableId: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
  },
  slots: {
    default: { help: 'Meant to receive an ObjectLink component' },
  },
  settings: {
    slot: { preset: 'Object link' },
  },
})
</script>
