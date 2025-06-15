<template>
  <StoryParamsTable>
    <thead>
      <tr>
        <th>Slot</th>
        <th>Slots props</th>
        <th />
      </tr>
    </thead>
    <tbody>
      <tr v-for="param in params" :key="param.name">
        <th class="name">
          {{ param.getFullName() }}
        </th>
        <td>
          <VtsCodeHighlight v-if="param.hasProps()" :code="param.getPropsType()" />
          <span v-else>-</span>
        </td>
        <td class="help">
          {{ param.getHelp() }}
        </td>
      </tr>
    </tbody>
  </StoryParamsTable>
</template>

<script lang="ts" setup>
import VtsCodeHighlight from '@core/packages/markdown/VtsCodeHighlight.vue'
import type { SlotParam } from '@core/packages/story/story-param.ts'
import StoryParamsTable from '@core/packages/story/StoryParamsTable.vue'

defineProps<{
  params: SlotParam[]
}>()
</script>
