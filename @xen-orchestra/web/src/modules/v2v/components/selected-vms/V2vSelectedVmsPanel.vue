<template>
  <VtsSidePanel has-selection persistent>
    <template v-if="areItemsShown" #actions>
      <UiButton
        accent="brand"
        variant="tertiary"
        size="medium"
        left-icon="action:close-cancel-clear"
        @click="emit('clear')"
      >
        {{ t('action:clear') }}
      </UiButton>
    </template>
    <UiPanelCard>
      <UiPanelCardTitle
        size="medium"
        icon="fa:list"
        :label="t('selected-vms')"
        :counter="{ value: count, accent: 'brand' }"
      />
      <InlineParts class="storage-info typo-body-regular-small">
        <span>{{ t('v2v:saved-in-this-browser') }}</span>
        <span>{{ t('v2v:sent-to-xo-at-launch') }}</span>
      </InlineParts>
      <V2vListLockSummary v-bind="lockSummary" />
      <UiTagsList v-if="areItemsShown">
        <UiTag v-for="tag of readinessTags" :key="tag.label" :accent="tag.accent" variant="secondary">
          {{ tag.label }}
        </UiTag>
      </UiTagsList>
    </UiPanelCard>
    <VtsStateHero v-if="isEmpty" format="panel" type="no-data" size="small">
      {{ t('v2v:no-vm-in-list') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="isBusy" format="panel" type="busy" size="small" />
    <template v-else>
      <V2vSelectedVmItem v-for="item of items" :key="item.id" :item @remove="id => emit('remove', id)" />
    </template>
  </VtsSidePanel>
</template>

<script lang="ts" setup>
import V2vListLockSummary from '@/modules/v2v/components/selected-vms/V2vListLockSummary.vue'
import V2vSelectedVmItem from '@/modules/v2v/components/selected-vms/V2vSelectedVmItem.vue'
import type { V2vListLock, V2vSelectedVm } from '@/modules/v2v/composables/use-v2v-selected-vms.composable.ts'
import type { V2vAccentedLabel } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import InlineParts from '@/shared/components/InlineParts.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import UiTag, { type TagAccent } from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import type { XoV2vVm } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { isEmpty, isBusy } = defineProps<{
  items: V2vSelectedVm[]
  count: number
  isEmpty: boolean
  isBusy: boolean
  readinessTags: V2vAccentedLabel<TagAccent>[]
  lockSummary: V2vListLock
}>()

const emit = defineEmits<{
  remove: [id: XoV2vVm['id']]
  clear: []
}>()

const { t } = useI18n()

const areItemsShown = computed(() => !isEmpty && !isBusy)
</script>

<style lang="postcss" scoped>
.storage-info {
  color: var(--color-neutral-txt-secondary);
}
</style>
