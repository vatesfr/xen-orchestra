<template>
  <StoryParamsTable>
    <thead>
      <tr>
        <th>Event</th>
        <th>Type</th>
        <th />
      </tr>
    </thead>
    <tbody>
      <tr v-for="param in params" :key="param.name">
        <th class="name">
          {{ param.getFullName() }}
        </th>
        <td>
          <VtsCodeHighlight :code="param.getTypeLabel()" />
        </td>
        <td>
          {{ param.getHelp() }}
        </td>
      </tr>
    </tbody>
  </StoryParamsTable>
</template>

<script lang="ts" setup>
import VtsCodeHighlight from '@core/packages/markdown/VtsCodeHighlight.vue'
import type { EventParam } from '@core/packages/story/story-param.ts'
import StoryParamsTable from '@core/packages/story/StoryParamsTable.vue'

defineProps<{
  params: EventParam[]
}>()
</script>
