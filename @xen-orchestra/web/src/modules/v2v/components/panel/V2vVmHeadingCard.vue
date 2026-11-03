<template>
  <UiPanelCard class="v2v-vm-heading-card">
    <UiPanelCardTitle :id :label="heading.name" icon="object:vm" size="medium" />
    <div class="content">
      <VtsCardRowKeyValue v-if="heading.statusTag">
        <template #key>{{ t('status') }}</template>
        <template #value>
          <UiTag :accent="heading.statusTag.accent" variant="secondary">{{ heading.statusTag.label }}</UiTag>
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('location') }}</template>
        <template #value>
          <InlineParts separator="chevron">
            <span v-for="part of heading.locationParts" :key="part">{{ part }}</span>
          </InlineParts>
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { V2vMappingVmHeading } from '@/modules/v2v/composables/use-v2v-mapping-step.composable.ts'
import InlineParts from '@/shared/components/InlineParts.vue'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import type { XoV2vVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

// A source VM has no page in XO to link to; its power state is not part of its heading, hence the plain VM icon
defineProps<{
  id: XoV2vVm['id']
  heading: V2vMappingVmHeading
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.v2v-vm-heading-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
