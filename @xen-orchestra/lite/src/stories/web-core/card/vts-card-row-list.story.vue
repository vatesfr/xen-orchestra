<template>
  <ComponentStory :params="[slot().help('Meant to receive VtsCardRowKeyValue components')]">
    <UiCard class="card">
      <VtsCardRowList>
        <VtsCardRowKeyValue :values="['10.0.0.12']">
          <template #key>IP address</template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue :values="['1500']">
          <template #key>MTU</template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>Status</template>
          <template #value>
            <UiInfo accent="success">Connected</UiInfo>
          </template>
        </VtsCardRowKeyValue>
      </VtsCardRowList>
    </UiCard>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { slot } from '@/libs/story/story-param.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardRowList from '@core/components/card/VtsCardRowList.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
</script>

<style lang="postcss" scoped>
.card {
  width: 400px;
}
</style>
