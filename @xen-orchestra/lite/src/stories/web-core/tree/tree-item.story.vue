<template>
  <ComponentStory
    :params="[
      slot().help('Meant to receive a <TreeItemLabel>'),
      slot('sublist').help('Meant to receive a <TreeList> child.'),
    ]"
  >
    <TreeList>
      <TreeItem>
        <TreeItemLabel :icon="faServer" route="dashboard">Host</TreeItemLabel>
        <template #sublist>
          <TreeList>
            <TreeItem>
              <TreeItemLabel no-indent route="dashboard">Sublist goes here</TreeItemLabel>
            </TreeItem>
          </TreeList>
        </template>
      </TreeItem>
    </TreeList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { slot } from '@/libs/story/story-param'
import TreeItem from '@core/components/tree/TreeItem.vue'
import TreeItemLabel from '@core/components/tree/TreeItemLabel.vue'
import TreeList from '@core/components/tree/TreeList.vue'
import { faServer } from '@fortawesome/free-solid-svg-icons'
</script>
