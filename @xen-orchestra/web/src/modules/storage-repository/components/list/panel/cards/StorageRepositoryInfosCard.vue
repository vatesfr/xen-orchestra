<template>
  <UiPanelCard class="storage-repository-infos-card">
    <UiPanelCardTitle :id="sr.id" size="medium" :label="sr.name_label" :to="srRoute" :icon="srStatusIcon" />
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('status') }}</template>
        <template #value>
          <VtsStatus :status="srConnectionStatus" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue truncate align-top>
        <template #key>{{ t('description') }}</template>
        <template #value>{{ sr.name_description }}</template>
        <template v-if="sr.name_description" #addons>
          <VtsCopyButton :value="sr.name_description" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue align-top>
        <template #key>{{ t('tags') }}</template>
        <template #value>
          <UiTagsList v-if="sr.tags.length > 0">
            <VtsTag v-for="tag in sr.tags" :key="tag" :value="tag" />
          </UiTagsList>
        </template>
        <template v-if="sr.tags.length > 0" #addons>
          <VtsCopyButton :value="sr.tags.join(', ')" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('storage-format') }}</template>
        <template #value>{{ sr.SR_type }}</template>
        <template #addons>
          <VtsCopyButton :value="sr.SR_type" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('access-mode') }}</template>
        <template #value>{{ isSrSharedI18nValue }}</template>
        <template #addons>
          <VtsCopyButton :value="isSrSharedI18nValue" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('provisioning') }}</template>
        <template #value>{{ allocationStrategy }}</template>
        <template #addons>
          <VtsCopyButton :value="allocationStrategy" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('high-availability') }}</template>
        <template #value><VtsStatus :status="isHaSr" /></template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import {
  type FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { getSrPageLocation } from '@/modules/storage-repository/utils/xo-sr.util.ts'
import type { SrScope } from '@core/types/storage-repository.type.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { sr, scope } = defineProps<{
  sr: FrontXoSr
  scope: SrScope
}>()

const { t } = useI18n()

const srRoute = computed(() => getSrPageLocation(sr, scope))

const { isHighAvailabilitySr } = useXoSrCollection()

const { srConnectionStatus, srStatusIcon, getSrAccessModeLabel, getSrProvisioningLabel } = useXoSrUtils(
  () => sr,
  () => scope
)

const isSrSharedI18nValue = computed(() => getSrAccessModeLabel(sr))

const allocationStrategy = computed(() => getSrProvisioningLabel(sr))

const isHaSr = isHighAvailabilitySr(() => sr)
</script>

<style scoped lang="postcss">
.storage-repository-infos-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
