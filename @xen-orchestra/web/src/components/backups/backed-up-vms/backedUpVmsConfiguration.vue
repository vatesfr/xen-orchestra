<template>
  <UiCard class="card-container">
    <UiTitle>
      {{ t('configuration') }}
      <UiCounter :value="backedUpVmsCount" accent="neutral" size="small" variant="primary" />
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
            <UiTagsList v-if="smartModeTags?.values !== undefined && smartModeTags.values.length > 0">
              <UiTag v-for="tag in smartModeTags.values" :key="tag" accent="info" variant="secondary">{{ tag }}</UiTag>
            </UiTagsList>
          </template>
        </VtsQuickInfoRow>
      </VtsColumn>
      <VtsColumn>
        <VtsQuickInfoRow :label="t('resident-on')">
          <template v-if="smartModePools" #value>
            <UiLink
              v-for="pool in smartModePools.values"
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
            <UiTagsList v-if="smartModeTags?.notValues !== undefined && smartModeTags.notValues.length > 0">
              <UiTag v-for="tag in smartModeTags.notValues" :key="tag" accent="info" variant="secondary">
                {{ tag }}
              </UiTag>
            </UiTagsList>
          </template>
        </VtsQuickInfoRow>
      </VtsColumn>
      <VtsColumn>
        <VtsQuickInfoRow :label="t('not-resident-on')">
          <template v-if="smartModePools" #value>
            <UiLink
              v-for="pool in smartModePools.notValues"
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
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import type { VmsSmartModeDisabled, VmsSmartModeEnabled, XoVmBackupJob } from '@/types/xo/vm-backup-job.type.ts'
import { type XoVm } from '@/types/xo/vm.type.ts'
import { destructSmartPattern, extractIdsFromSimplePattern } from '@/utils/pattern.util.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import * as ValueMatcher from 'value-matcher'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backedUpVms: rawBackedUpVms } = defineProps<{
  backedUpVms: XoVmBackupJob['vms']
}>()

const { t } = useI18n()

const { getPoolsByIds } = useXoPoolCollection()
const { getVmsByIds, vms } = useXoVmCollection()

const isSmartModeEnabled = computed(() => checkSmartModeEnabled(rawBackedUpVms))

function checkSmartModeEnabled(
  value: VmsSmartModeEnabled | VmsSmartModeDisabled | undefined
): value is VmsSmartModeEnabled {
  if (value === undefined || typeof value !== 'object' || value === null) {
    return false
  }

  return !('id' in value)
}

const backedUpVms = computed(() => {
  if (checkSmartModeEnabled(rawBackedUpVms)) {
    const predicate = ValueMatcher.createPredicate(rawBackedUpVms)

    return vms.value.filter(vm => predicate(vm) && !vm.tags?.includes('xo:no-bak'))
  }

  return getVmsByIds(extractIdsFromSimplePattern(rawBackedUpVms) as XoVm['id'][])
})

const backedUpVmsCount = computed(() => backedUpVms.value.length)

const smartModePools = computed(() => {
  if (!checkSmartModeEnabled(rawBackedUpVms) || rawBackedUpVms.$pool === undefined) {
    return undefined
  }

  const poolIds = destructSmartPattern(rawBackedUpVms.$pool)

  if (!poolIds) {
    return undefined
  }

  return {
    values: getPoolsByIds(poolIds.values),
    notValues: getPoolsByIds(poolIds.notValues),
  }
})

const smartModeTags = computed(() => {
  if (!checkSmartModeEnabled(rawBackedUpVms) || rawBackedUpVms.tags === undefined) {
    return undefined
  }

  const tags = destructSmartPattern(rawBackedUpVms.tags)

  return {
    values: tags.values?.flat(),
    notValues: [...tags.notValues?.flat(), 'xo:no-bak'],
  }
})
</script>

<style scoped lang="postcss">
.card-container {
  .divider {
    margin-block: 1.6rem;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }
}
</style>
