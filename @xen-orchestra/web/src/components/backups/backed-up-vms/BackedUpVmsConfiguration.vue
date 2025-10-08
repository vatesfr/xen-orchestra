<template>
  <UiCard>
    <UiTitle>
      {{ t('configuration') }}
    </UiTitle>
    <template v-if="!isSmartModeEnabled">
      <UiLabelValue :label="t('smart-mode')">
        <template #value>
          <VtsStatus status="disabled" />
        </template>
      </UiLabelValue>
    </template>
    <VtsColumns v-else>
      <VtsColumn class="column">
        <UiLabelValue :label="t('smart-mode')">
          <template #value>
            <VtsStatus status="enabled" />
          </template>
        </UiLabelValue>
        <UiLabelValue :label="t('vms-tags')" :value="smartModeTags ? smartModeTags.included : undefined" />
      </VtsColumn>
      <VtsColumn class="column">
        <UiLabelValue :label="t('resident-on')">
          <template v-if="smartModePools !== undefined" #value>
            <UiLink
              v-for="pool in smartModePools.included"
              :key="pool.id"
              size="small"
              icon="fa:city"
              :to="`/pool/${pool.id}/dashboard`"
              class="link"
            >
              <div v-tooltip class="text-ellipsis">
                {{ pool.name_label }}
              </div>
            </UiLink>
          </template>
        </UiLabelValue>
        <UiLabelValue :label="t('excluded-vms-tags')" :value="smartModeTags ? smartModeTags.excluded : undefined" />
      </VtsColumn>
      <VtsColumn class="column">
        <UiLabelValue :label="t('not-resident-on')">
          <template v-if="smartModePools !== undefined" #value>
            <UiLink
              v-for="pool in smartModePools.excluded"
              :key="pool.id"
              size="small"
              icon="fa:city"
              :to="`/pool/${pool.id}/dashboard`"
              class="link"
            >
              <div v-tooltip class="text-ellipsis">
                {{ pool.name_label }}
              </div>
            </UiLink>
          </template>
        </UiLabelValue>
        <UiLabelValue :label="t('power-state')">
          <template v-if="smartModePowerState !== undefined" #value>
            <VtsIcon size="small" :name="`legacy:${toLower(smartModePowerState)}`" />
            {{ smartModePowerState }}
          </template>
        </UiLabelValue>
      </VtsColumn>
    </VtsColumns>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoBackedUpVmsUtils } from '@/composables/xo-backed-up-vms-utils.composable'
import type { XoVmBackupJob } from '@/types/xo/vm-backup-job.type.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { toLower } from 'lodash-es'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: XoVmBackupJob
}>()

const { t } = useI18n()

const { isSmartModeEnabled, smartModePools, smartModeTags, smartModePowerState } = useXoBackedUpVmsUtils(
  () => backupJob.vms
)
</script>

<style lang="postcss" scoped>
.column {
  gap: 2.4rem;

  .link {
    width: 100%;
  }
}
</style>
