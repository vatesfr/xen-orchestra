<template>
  <UiCard>
    <UiTitle>
      {{ t('configuration') }}
    </UiTitle>
    <VtsColumns>
      <VtsColumn>
        <VtsQuickInfoRow :label="t('smart-mode')">
          <template #value>
            <VtsEnabledState :enabled="isSmartModeEnabled" />
          </template>
        </VtsQuickInfoRow>
        <VtsQuickInfoRow :label="t('vms-tags')">
          <template #value>
            <UiTagsList v-if="smartModeConfig.tags?.values !== undefined && smartModeConfig.tags.values.length > 0">
              <UiTag v-for="tag in smartModeConfig.tags.values" :key="tag" accent="info" variant="secondary">
                {{ tag }}
              </UiTag>
            </UiTagsList>
          </template>
        </VtsQuickInfoRow>
      </VtsColumn>
      <VtsColumn>
        <VtsQuickInfoRow :label="t('resident-on')">
          <template v-if="smartModeConfig.pools" #value>
            <UiLink
              v-for="pool in smartModeConfig.pools.values"
              :key="pool.id"
              size="small"
              icon="fa:city"
              :to="`/pool/${pool.id}`"
            >
              {{ pool.name_label }}
            </UiLink>
          </template>
        </VtsQuickInfoRow>
        <VtsQuickInfoRow :label="t('excluded-vms-tags')">
          <template #value>
            <UiTagsList
              v-if="smartModeConfig.tags?.notValues !== undefined && smartModeConfig.tags.notValues.length > 0"
            >
              <UiTag v-for="tag in smartModeConfig.tags.notValues" :key="tag" accent="info" variant="secondary">
                {{ tag }}
              </UiTag>
            </UiTagsList>
          </template>
        </VtsQuickInfoRow>
      </VtsColumn>
      <VtsColumn>
        <VtsQuickInfoRow :label="t('not-resident-on')">
          <template v-if="smartModeConfig.pools" #value>
            <UiLink
              v-for="pool in smartModeConfig.pools.notValues"
              :key="pool.id"
              size="small"
              icon="fa:city"
              :to="`/pool/${pool.id}`"
            >
              {{ pool.name_label }}
            </UiLink>
          </template>
        </VtsQuickInfoRow>
      </VtsColumn>
    </VtsColumns>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoPoolCollection } from '@/remote-resources/use-xo-pool-collection.ts'
import type { VmsSmartModeDisabled, VmsSmartModeEnabled, XoVmBackupJob } from '@/types/xo/vm-backup-job.type.ts'
import { destructSmartPattern } from '@/utils/pattern.util.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backedUpVms: rawBackedUpVms } = defineProps<{
  backedUpVms: XoVmBackupJob['vms']
}>()

const { t } = useI18n()

const { getPoolsByIds } = useXoPoolCollection()

const isSmartModeEnabled = computed(() => checkSmartModeEnabled(rawBackedUpVms))

function checkSmartModeEnabled(
  value: VmsSmartModeEnabled | VmsSmartModeDisabled | undefined
): value is VmsSmartModeEnabled {
  if (value === undefined || typeof value !== 'object' || value === null) {
    return false
  }

  return !('id' in value)
}

const smartModeConfig = computed(() => {
  if (!checkSmartModeEnabled(rawBackedUpVms)) {
    return {
      pools: undefined,
      tags: undefined,
    }
  }

  let pools
  if (rawBackedUpVms.$pool !== undefined) {
    const poolIds = destructSmartPattern(rawBackedUpVms.$pool)
    if (poolIds) {
      pools = {
        values: getPoolsByIds(poolIds.values),
        notValues: getPoolsByIds(poolIds.notValues),
      }
    }
  }

  let tags
  if (rawBackedUpVms.tags !== undefined) {
    const tagPattern = destructSmartPattern(rawBackedUpVms.tags)
    tags = {
      values: tagPattern.values?.flat(),
      notValues: [...tagPattern.notValues?.flat(), 'xo:no-bak'],
    }
  }

  return {
    pools,
    tags,
  }
})
</script>
