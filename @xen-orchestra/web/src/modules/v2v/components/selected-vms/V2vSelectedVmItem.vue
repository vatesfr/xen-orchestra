<template>
  <UiPanelCard>
    <UiPanelCardTitle size="small" :label="item.name" :to="item.mappingRoute">
      <template #action>
        <UiTag :accent="item.kind.accent" variant="secondary">{{ item.kind.label }}</UiTag>
      </template>
      <template #more-actions>
        <UiButtonIcon
          v-tooltip="removeLabel"
          icon="action:close-cancel-clear"
          accent="brand"
          size="small"
          :aria-label="removeLabel"
          @click="emit('remove', item.id)"
        />
      </template>
    </UiPanelCardTitle>
    <InlineParts v-if="item.mappingParts.length > 0" class="mapping typo-body-regular-small">
      <span v-for="part of item.mappingParts" :key="part">{{ part }}</span>
    </InlineParts>
    <UiInfo :accent="item.check.accent" size="small">{{ item.check.label }}</UiInfo>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { V2vSelectedVm } from '@/modules/v2v/composables/use-v2v-selected-vms.composable.ts'
import InlineParts from '@/shared/components/InlineParts.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import type { XoV2vVm } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { item } = defineProps<{
  item: V2vSelectedVm
}>()

const emit = defineEmits<{
  remove: [id: XoV2vVm['id']]
}>()

const { t } = useI18n()

const removeLabel = computed(() => t('action:remove-name-from-list', { name: item.name }))
</script>

<style lang="postcss" scoped>
.mapping {
  color: var(--color-neutral-txt-secondary);
}
</style>
