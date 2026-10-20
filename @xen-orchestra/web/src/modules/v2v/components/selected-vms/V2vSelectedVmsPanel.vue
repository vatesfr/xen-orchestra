<template>
  <VtsPanel v-if="isOpen" class="v2v-selected-vms-panel">
    <UiPanelCardTitle
      size="medium"
      icon="fa:list"
      :label="t('selected-vms')"
      :counter="{ value: count, accent: 'brand' }"
    >
      <template #more-actions>
        <UiButtonIcon
          v-tooltip="t('action:hide')"
          icon="fa:angle-right"
          accent="brand"
          size="small"
          :aria-label="t('action:hide')"
          @click="emit('toggle')"
        />
      </template>
    </UiPanelCardTitle>
    <InlineParts class="storage-info typo-body-regular-small">
      <span>{{ t('v2v:saved-in-this-browser') }}</span>
      <span>{{ t('v2v:sent-to-xo-at-launch') }}</span>
    </InlineParts>
    <V2vListLockSummary v-bind="lockSummary" />
    <VtsStateHero v-if="isEmpty" format="panel" type="no-data" size="small">
      {{ t('v2v:no-vm-in-list') }}
    </VtsStateHero>
    <template v-else>
      <div class="readiness">
        <UiTag v-for="tag of readinessTags" :key="tag.label" :accent="tag.accent" variant="secondary">
          {{ tag.label }}
        </UiTag>
      </div>
      <ul class="items">
        <V2vSelectedVmItem v-for="item of items" :key="item.id" :item @remove="id => emit('remove', id)" />
      </ul>
      <UiButton accent="brand" variant="secondary" size="medium" class="clear" @click="emit('clear')">
        {{ t('action:clear') }}
      </UiButton>
    </template>
  </VtsPanel>
  <UiButton v-else accent="brand" variant="secondary" size="medium" left-icon="fa:list" @click="emit('toggle')">
    {{ t('selected-vms-n', { n: count }) }}
  </UiButton>
</template>

<script lang="ts" setup>
import V2vListLockSummary from '@/modules/v2v/components/selected-vms/V2vListLockSummary.vue'
import V2vSelectedVmItem from '@/modules/v2v/components/selected-vms/V2vSelectedVmItem.vue'
import type {
  V2vListLock,
  V2vSelectedVmItem as SelectedVmItem,
} from '@/modules/v2v/composables/use-v2v-selected-vms.composable.ts'
import type { V2vVmTag } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import InlineParts from '@/shared/components/InlineParts.vue'
import VtsPanel from '@core/components/panel/VtsPanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import type { XoV2vVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

defineProps<{
  items: SelectedVmItem[]
  count: number
  isEmpty: boolean
  readinessTags: V2vVmTag[]
  lockSummary: V2vListLock
  isOpen: boolean
}>()

const emit = defineEmits<{
  remove: [id: XoV2vVm['id']]
  clear: []
  toggle: []
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.v2v-selected-vms-panel {
  .storage-info {
    color: var(--color-neutral-txt-secondary);
  }

  .readiness {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  .items {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    margin: 0;
    padding: 0;
  }

  .clear {
    align-self: flex-end;
  }
}
</style>
