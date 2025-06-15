<template>
  <ComponentStory :params>
    <table>
      <tr>
        <VtsCellText>
          {{ settings.slot }}
          <template #secondary>{{ settings.secondary }}</template>
        </VtsCellText>
      </tr>
    </table>
  </ComponentStory>
</template>

<script lang="ts" setup>
import VtsCellText from '@core/components/cell-text/VtsCellText.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'

const { params, settings } = useStory({
  slots: {
    default: { help: 'Meant to receive the main label' },
    secondary: { help: 'Meant to receive the secondary label' },
  },
  settings: {
    slot: { preset: 'Primary label' },
    secondary: { preset: 'Secondary label' },
  },
})
</script>
