<template>
  <ComponentStory :params="[slot()]">
    <TreeList>
      <TreeItem>
        <TreeItemLabel :icon="faCity" route="dashboard">Pool</TreeItemLabel>
        <template #sublist>
          <TreeList>
            <TreeItem v-for="i of 3" :key="i">
              <TreeItemLabel :icon="faServer" route="dashboard">
                Host - {{ i }}
                <template #addons>
                  <ButtonIcon v-if="i === 2" :icon="faStar" color="warning" />
                  <VtsCounter accent="brand" value="3" variant="secondary" size="small" />
                </template>
              </TreeItemLabel>
              <template #sublist>
                <TreeList>
                  <TreeItem v-for="j of 3" :key="j">
                    <TreeItemLabel no-indent route="dashboard">
                      <template #icon>
                        <ObjectIcon :state="j === 3 ? 'halted' : 'running'" type="vm" />
                      </template>
                      VM {{ i }}.{{ j }}
                      <template #addons>
                        <VtsIcon v-if="j === 2" busy accent="current" />
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
import { slot } from '@/libs/story/story-param'
import ButtonIcon from '@core/components/button/ButtonIcon.vue'
import VtsCounter from '@core/components/counter/VtsCounter.vue'
import ObjectIcon from '@core/components/icon/ObjectIcon.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import TreeItem from '@core/components/tree/TreeItem.vue'
import TreeItemLabel from '@core/components/tree/TreeItemLabel.vue'
import TreeList from '@core/components/tree/TreeList.vue'
import { faCity, faEllipsis, faServer, faStar } from '@fortawesome/free-solid-svg-icons'
</script>
