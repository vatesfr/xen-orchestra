<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('hasChildren')
        .bool()
        .widget()
        .preset(true)
        .help('Forces the collapse button, overriding the auto-detected presence of the sublist slot.'),
      slot().help('Meant to receive a <UiTreeItemLabel>'),
      slot('sublist').help('Meant to receive a <VtsTreeList> child.'),
    ]"
  >
    <VtsTreeList>
      <VtsTreeItem :expanded="isExpanded" :has-children="properties.hasChildren">
        <UiTreeItemLabel icon="object:host" route="dashboard" @toggle="isExpanded = !isExpanded">Host</UiTreeItemLabel>
        <template #sublist>
          <VtsTreeList>
            <VtsTreeItem v-for="i in 2" :key="i">
              <UiTreeItemLabel icon="object:vm" no-indent route="dashboard">VM {{ i }}</UiTreeItemLabel>
            </VtsTreeItem>
          </VtsTreeList>
        </template>
      </VtsTreeItem>
    </VtsTreeList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param.ts'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { ref } from 'vue'

const isExpanded = ref(true)
</script>
