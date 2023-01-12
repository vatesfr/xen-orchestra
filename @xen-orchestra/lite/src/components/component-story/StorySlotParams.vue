<template>
  <StoryParamsTable>
    <thead>
      <tr>
        <th>Slot</th>
        <th>Slots props</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="param in params" :key="param.name">
        <th class="name">
          {{ param.getFullName() }}
        </th>
        <td>
          <CodeHighlight v-if="param.hasProps()" :code="param.getPropsType()" />
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
import CodeHighlight from "@/components/CodeHighlight.vue";
import StoryParamsTable from "@/components/component-story/StoryParamsTable.vue";
import type { SlotParam } from "@/libs/story/story-param";

defineProps<{
  params: SlotParam[];
}>();
</script>
