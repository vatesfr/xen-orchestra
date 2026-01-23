<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      slot('key').help('Meant to receive a title'),
      slot('value').help('Meant to receive text, tags or other value'),
      slot('addons').help('Meant to receive icons or other actions buttons '),
      setting('defaultSlotContent').preset('Uuid').widget(text()),
      setting('contentSlotContent').preset('71df26a271df26a271df26a271df26a271df26a').widget(text()),
    ]"
  >
    <UiCard class="card">
      <VtsCardRowKeyValue v-bind="properties">
        <template #key>
          {{ settings.defaultSlotContent }}
        </template>
        <template #value>
          <span>
            {{ settings.contentSlotContent }}
          </span>
        </template>
        <template #addons>
          <VtsIcon name="status:primary-circle" size="medium" />
          <UiButtonIcon icon="fa:copy" size="small" accent="brand" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue v-bind="properties">
        <template #key>
          <span>Network</span>
        </template>

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
        <template #key>
          <span>Status</span>
        </template>
        <template #value>
          <UiInfo accent="success">Connected</UiInfo>
        </template>
        <template #addons>
          <UiButtonIcon icon="fa:copy" size="small" accent="brand" />
          <UiButtonIcon icon="fa:ellipsis" size="small" accent="brand" />
        </template>
      </VtsCardRowKeyValue>
    </UiCard>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
</script>

<style lang="postcss" scoped>
.card {
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
