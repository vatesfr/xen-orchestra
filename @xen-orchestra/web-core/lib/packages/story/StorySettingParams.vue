<template>
  <StoryParamsTable>
    <thead>
      <tr>
        <th>Setting</th>
        <th><!-- Widget --></th>
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
            v-if="param.hasWidget() && param.ref.value !== undefined"
            v-model="param.ref.value"
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
import type { SettingParam } from '@core/packages/story/story-param.ts'
import StoryParamsTable from '@core/packages/story/StoryParamsTable.vue'
import StoryWidget from '@core/packages/story/StoryWidget.vue'

defineProps<{
  params: SettingParam[]
}>()

const emit = defineEmits<{
  reset: []
}>()
</script>

<style lang="postcss" scoped>
.reset-all {
  text-align: right;
  padding-top: 1.2rem;
}
</style>
