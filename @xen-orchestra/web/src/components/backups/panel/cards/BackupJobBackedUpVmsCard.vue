<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('backed-up-vms') }}
      <UiCounter :value="backedUpVmsCount" accent="neutral" size="small" variant="primary" />
    </UiCardTitle>
    <div>
      <!-- Smart mode state -->
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('smart-mode') }}
        </template>
        <template #value>
          <VtsStatus :status="isSmartModeEnabled" />
        </template>
      </VtsCardRowKeyValue>
      <template v-if="isSmartModeEnabled">
        <VtsDivider class="divider" type="stretch" />
        <div class="content">
          <!-- Power state -->
          <VtsCardRowKeyValue v-if="smartModePowerState !== undefined">
            <template #key>
              {{ t('power-state') }}
            </template>
            <template #value>
              <VtsIcon size="small" :name="`legacy:${toLower(smartModePowerState)}`" />
              {{ smartModePowerState }}
            </template>
          </VtsCardRowKeyValue>
          <!-- Pools -->
          <template v-if="smartModePools !== undefined">
            <BackupJobSmartModePools
              v-for="(pool, index) in smartModePools.included"
              :key="pool.id"
              :pool
              :label="index === 0 ? t('resident-on') : undefined"
            />
            <BackupJobSmartModePools
              v-for="(pool, index) in smartModePools.excluded"
              :key="pool.id"
              :pool
              :label="index === 0 ? t('not-resident-on') : undefined"
            />
          </template>
          <!-- Tags -->
          <template v-if="smartModeTags !== undefined">
            <BackupJobSmartModeTags :tags="smartModeTags.included ?? []" :label="t('vms-tags')" />
            <BackupJobSmartModeTags :tags="smartModeTags.excluded ?? []" :label="t('excluded-vms-tags')" />
          </template>
        </div>
      </template>
      <template v-if="backedUpVmsCount > 0">
        <VtsDivider class="divider" type="stretch" />
        <!-- Backed up VMs list -->
        <UiCollapsibleList tag="ul" :total-items="backedUpVmsCount">
          <li v-for="vm in backedUpVms" :key="vm.id">
            <UiLink size="small" :icon="`object:vm:${toLower(vm.power_state)}`" :to="`/vm/${vm.id}`">
              {{ vm.name_label }}
            </UiLink>
          </li>
        </UiCollapsibleList>
      </template>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import BackupJobSmartModePools from '@/components/backups/panel/card-items/BackupJobSmartModePools.vue'
import BackupJobSmartModeTags from '@/components/backups/panel/card-items/BackupJobSmartModeTags.vue'
import { useXoPoolCollection } from '@/remote-resources/use-xo-pool-collection.ts'
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import type { VmsSmartModeDisabled, VmsSmartModeEnabled, XoVmBackupJob } from '@/types/xo/vm-backup-job.type.ts'
import { type XoVm } from '@/types/xo/vm.type.ts'
import { destructSmartPattern, extractIdsFromSimplePattern } from '@/utils/pattern.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { toLower } from 'lodash-es'
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
    included: getPoolsByIds(poolIds.values),
    excluded: getPoolsByIds(poolIds.notValues),
  }
})

const smartModeTags = computed(() => {
  if (!checkSmartModeEnabled(rawBackedUpVms) || rawBackedUpVms.tags === undefined) {
    return undefined
  }

  const tags = destructSmartPattern(rawBackedUpVms.tags)

  return {
    included: tags.values?.flat(),
    excluded: [...tags.notValues?.flat(), 'xo:no-bak'],
  }
})

const smartModePowerState = computed(() => {
  if (!checkSmartModeEnabled(rawBackedUpVms) || rawBackedUpVms.power_state === undefined) {
    return undefined
  }

  return rawBackedUpVms.power_state
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
