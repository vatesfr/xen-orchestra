<template>
  <UiCard>
    <UiTitle>
      {{ t('configuration') }}
    </UiTitle>
    <template v-if="!isSmartModeEnabled">
      <VtsQuickInfoRow :label="t('smart-mode')">
        <template #value>
          <VtsStatus status="disabled" />
        </template>
      </VtsQuickInfoRow>
    </template>
    <VtsColumns v-else>
      <VtsColumn class="column">
        <VtsQuickInfoRow :label="t('smart-mode')">
          <template #value>
            <VtsStatus status="enabled" />
          </template>
        </VtsQuickInfoRow>
        <VtsQuickInfoRow :label="t('vms-tags')">
          <template v-if="smartModeTags?.included !== undefined && smartModeTags.included.length > 0" #value>
            <UiTagsList>
              <UiTag v-for="tag in smartModeTags.included" :key="tag" accent="info" variant="secondary">
                {{ tag }}
              </UiTag>
            </UiTagsList>
          </template>
        </VtsQuickInfoRow>
      </VtsColumn>
      <VtsColumn class="column">
        <VtsQuickInfoRow :label="t('resident-on')">
          <template v-if="smartModePools !== undefined" #value>
            <UiLink
              v-for="pool in smartModePools.included"
              :key="pool.id"
              size="small"
              icon="fa:city"
              :to="`/pool/${pool.id}/dashboard`"
            >
              {{ pool.name_label }}
            </UiLink>
          </template>
        </VtsQuickInfoRow>
        <VtsQuickInfoRow :label="t('excluded-vms-tags')">
          <template v-if="smartModeTags !== undefined && smartModeTags.excluded.length > 0" #value>
            <UiTagsList>
              <UiTag v-for="tag in smartModeTags.excluded" :key="tag" accent="info" variant="secondary">
                {{ tag }}
              </UiTag>
            </UiTagsList>
          </template>
        </VtsQuickInfoRow>
      </VtsColumn>
      <VtsColumn class="column">
        <VtsQuickInfoRow :label="t('not-resident-on')">
          <template v-if="smartModePools !== undefined" #value>
            <UiLink
              v-for="pool in smartModePools.excluded"
              :key="pool.id"
              size="small"
              icon="fa:city"
              :to="`/pool/${pool.id}/dashboard`"
            >
              {{ pool.name_label }}
            </UiLink>
          </template>
        </VtsQuickInfoRow>
        <VtsQuickInfoRow :label="t('power-state')">
          <template v-if="smartModePowerState !== undefined" #value>
            <VtsIcon size="small" :name="`legacy:${toLower(smartModePowerState)}`" />
            {{ smartModePowerState }}
          </template>
        </VtsQuickInfoRow>
      </VtsColumn>
    </VtsColumns>
  </UiCard>
</template>

<script lang="ts" setup>
import { useBackedUpVmsUtils } from '@/modules/backup/composables/backed-up-vms-utils.composable.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import type { XoVmBackupJob } from '@vates/types'
import { toLower } from 'lodash-es'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: XoVmBackupJob
}>()

const { t } = useI18n()

const { isSmartModeEnabled, smartModePools, smartModeTags, smartModePowerState } = useBackedUpVmsUtils(
  () => backupJob.vms
)
</script>

<style lang="postcss" scoped>
.column {
  gap: 2.4rem;
}
</style>
