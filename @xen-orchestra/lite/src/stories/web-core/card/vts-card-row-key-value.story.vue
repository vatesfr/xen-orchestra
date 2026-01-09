<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      slot('key').help('Meant to receive a title'),
      slot('value').help('Meant to receive text, tags or other value'),
      slot('addons').help('Meant to receive icons or other actions buttons '),
      prop('truncate')
        .type('boolean | number')
        .widget(
          choice(
            { label: 'Default (5 lines)', value: true },
            { label: 'Disabled', value: undefined },
            { label: '3 lines', value: 3 },
            { label: '5 lines', value: 5 },
            { label: '10 lines', value: 10 }
          )
        )
        .preset(true),
      prop('alignTop')
        .help('Whether to align the key on the first line in case of multiline value')
        .type('boolean')
        .widget(),
      setting('valueSlotDescription')
        .preset(
          'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Velit facilis pariatur maiores officia fugit odit, doloremque obcaecati quisquam distinctio adipisci fugiat incidunt hic rerum? Ullam, natus. Iste eum porro dolorum!'
        )
        .widget(text()),
    ]"
  >
    <UiCard class="card">
      <VtsCardRowKeyValue v-bind="properties">
        <template #key>Description</template>
        <template #value>{{ settings.valueSlotDescription }}</template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue v-bind="properties">
        <template #key>Network</template>
        <template #value>
          <UiObjectLink route="`/vm/test/console`" icon="object:network:connected">
            <span>Network Name</span>
          </UiObjectLink>
        </template>
        <template #addons>
          <UiButtonIcon icon="fa:copy" size="small" accent="brand" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue v-bind="properties">
        <template #key>Status</template>
        <template #value>
          <UiInfo accent="success">Connected</UiInfo>
        </template>
        <template #addons>
          <UiButtonIcon icon="fa:copy" size="small" accent="brand" />
          <UiButtonIcon icon="fa:ellipsis" size="small" accent="brand" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue v-bind="properties">
        <template #key>Tags</template>
        <template #value>
          <UiTagsList v-if="tags.length > 0">
            <UiTag v-for="tag in tags" :key="tag" accent="info" variant="secondary">{{ tag }}</UiTag>
          </UiTagsList>
        </template>
        <template v-if="tags.length > 0" #addons>
          <VtsCopyButton :value="tags.join(', ')" />
        </template>
      </VtsCardRowKeyValue>
    </UiCard>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { choice, text } from '@/libs/story/story-widget'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'

const tags = [
  'Load balancer - A',
  'Load balancer - B',
  'Load balancer - C',
  'Load balancer - D',
  'Load balancer - E',
  'Load balancer - F',
]
</script>

<style lang="postcss" scoped>
.card {
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
