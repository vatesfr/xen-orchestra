<template>
  <StoryParamsTable>
    <thead>
      <tr>
        <th>Event</th>
        <th>Type</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="param in params" :key="param.name">
        <th class="name">
          {{ param.getFullName() }}
        </th>
        <td>
          <CodeHighlight :code="param.getTypeLabel()" />
        </td>
        <td>
          {{ param.getHelp() }}
        </td>
      </tr>
    </tbody>
  </StoryParamsTable>
</template>

<script lang="ts" setup>
import CodeHighlight from "@/components/CodeHighlight.vue";
import StoryParamsTable from "@/components/component-story/StoryParamsTable.vue";
import type { EventParam } from "@/libs/story/story-param";

defineProps<{
  params: EventParam[];
}>();
</script>
