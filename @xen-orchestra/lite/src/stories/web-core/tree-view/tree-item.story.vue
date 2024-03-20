<template>
  <ComponentStory :params="[slot(), slot('sublist')]">
    <TreeList>
      <TreeItem>
        <TreeItemLabel route="dashboard" :icon="faServer">Host</TreeItemLabel>
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
import TreeItem from '@core/components/tree-view/TreeItem.vue'
import TreeItemLabel from '@core/components/tree-view/TreeItemLabel.vue'
import TreeList from '@core/components/tree-view/TreeList.vue'
import { faServer } from '@fortawesome/free-solid-svg-icons'
</script>
