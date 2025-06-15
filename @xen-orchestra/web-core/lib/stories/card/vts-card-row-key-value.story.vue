<template>
  <ComponentStory :params>
    <UiCard class="card">
      <VtsCardRowKeyValue>
        <template #key>
          {{ settings.defaultSlotContent }}
        </template>
        <template #value>
          <span>
            {{ settings.contentSlotContent }}
          </span>
        </template>
        <template #addons>
          <VtsIcon accent="info" :icon="faCircle" :overlay-icon="faStar" />
          <UiButtonIcon :icon="faCopy" size="medium" accent="brand" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue>
        <template #key>
          <span>Network</span>
        </template>

        <template #value>
          <UiObjectLink route="`/vm/test/console`">
            <template #icon>
              <UiComplexIcon size="medium">
                <VtsIcon :icon="faNetworkWired" accent="current" />
                <VtsIcon accent="success" :icon="faCircle" :overlay-icon="faCheck" />
              </UiComplexIcon>
            </template>
            <span>Network Name</span>
          </UiObjectLink>
        </template>
        <template #addons>
          <UiButtonIcon :icon="faCopy" size="medium" accent="brand" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue>
        <template #key>
          <span>Status</span>
        </template>
        <template #value>
          <UiInfo accent="success">Connected</UiInfo>
        </template>
        <template #addons>
          <UiButtonIcon :icon="faCopy" size="medium" accent="brand" />
          <UiButtonIcon :icon="faEllipsis" size="medium" accent="brand" />
        </template>
      </VtsCardRowKeyValue>
    </UiCard>
  </ComponentStory>
</template>

<script lang="ts" setup>
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiComplexIcon from '@core/components/ui/complex-icon/UiComplexIcon.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'
import { faCheck, faCircle, faCopy, faEllipsis, faNetworkWired, faStar } from '@fortawesome/free-solid-svg-icons'

const { params, settings } = useStory({
  slots: {
    key: { help: 'Meant to receive a title' },
    value: { help: 'Meant to receive text, tags or other value' },
    addons: { help: 'Meant to receive icons or other actions buttons ' },
  },
  settings: {
    defaultSlotContent: { preset: 'Uuid' },
    contentSlotContent: { preset: '71df26a271df26a271df26a271df26a271df26a' },
  },
})
</script>

<style lang="postcss" scoped>
.card {
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
