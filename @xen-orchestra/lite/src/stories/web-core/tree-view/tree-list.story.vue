<template>
  <ComponentStory :params="[]">
    <TreeList>
      <TreeItem>
        <TreeItemLabel route="dashboard" :icon="faCity"> Pool </TreeItemLabel>
        <template #sublist>
          <TreeList v-for="i in 3" :key="i">
            <TreeItem>
              <TreeItemLabel route="dashboard" :icon="faServer">
                Host - {{ i }}
                <template #addons>
                  <ButtonIcon v-if="i === 2" :icon="faStar" color="warning" />
                  <UiCounter value="3" color="info" />
                </template>
              </TreeItemLabel>
              <template #sublist>
                <TreeList>
                  <TreeItem>
                    <TreeItemLabel no-indent route="dashboard">
                      VM {{ i }}
                      <template #addons>
                        <UiIcon v-if="i === 2" busy />
                        <ButtonIcon :icon="faEllipsis" />
                      </template>
                    </TreeItemLabel>
                  </TreeItem>
                </TreeList>
              </template>
            </TreeItem>
          </TreeList>
        </template>
      </TreeItem>
    </TreeList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import UiIcon from '@/components/ui/icon/UiIcon.vue'
import ButtonIcon from '@core/components/button/ButtonIcon.vue'
import TreeItem from '@core/components/tree-view/TreeItem.vue'
import TreeItemLabel from '@core/components/tree-view/TreeItemLabel.vue'
import TreeList from '@core/components/tree-view/TreeList.vue'
import UiCounter from '@core/components/UiCounter.vue'
import { faCity, faEllipsis, faServer, faStar } from '@fortawesome/free-solid-svg-icons'
</script>
