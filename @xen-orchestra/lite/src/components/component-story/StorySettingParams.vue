<template>
  <StoryParamsTable>
    <thead>
      <tr>
        <th>Setting</th>
        <th><!--Widget--></th>
        <th>Help</th>
      </tr>
    </thead>
    <tfoot>
      <tr>
        <td colspan="6" class="reset-all">
          <span class="link" @click="emit('reset')">Reset</span>
        </td>
      </tr>
    </tfoot>
    <tbody>
      <tr v-for="param in params" :key="param.name">
        <th class="name">
          {{ param.getFullName() }}
        </th>
        <td>
          <StoryWidget
            v-if="param.hasWidget() && model !== undefined"
            v-model="model[param.name]"
            :widget="param.getWidget()!"
          />
        </td>
        <td>
          {{ param.getHelp() }}
        </td>
      </tr>
    </tbody>
  </StoryParamsTable>
</template>

<script lang="ts" setup>
import { useVModel } from "@vueuse/core";
import StoryParamsTable from "@/components/component-story/StoryParamsTable.vue";
import StoryWidget from "@/components/component-story/StoryWidget.vue";
import type { SettingParam } from "@/libs/story/story-param";

const props = defineProps<{
  params: SettingParam[];
  modelValue?: Record<string, any>;
}>();

const emit = defineEmits<{
  (event: "reset"): void;
  (event: "update:modelValue", value: any): void;
}>();

const model = useVModel(props, "modelValue", emit);
</script>

<style lang="postcss">
.reset-all {
  text-align: right;
  padding-top: 1.2rem;
}
</style>
