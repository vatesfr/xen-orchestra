<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('backed-up-vms') }}
      <UiCounter :value="backedUpVmsCount" accent="neutral" size="small" variant="primary" />
    </UiCardTitle>
    <div>
      <!-- Smart mode state -->
      <UiLabelValue :label="t('smart-mode')" ellipsis>
        <template #value>
          <VtsStatus :status="isSmartModeEnabled" />
        </template>
      </UiLabelValue>
      <template v-if="isSmartModeEnabled">
        <VtsDivider class="divider" type="stretch" />
        <div class="content">
          <!-- Power state -->
          <UiLabelValue v-if="smartModePowerState !== undefined" :label="t('power-state')" ellipsis>
            <template #value>
              <VtsIcon size="small" :name="`legacy:${toLower(smartModePowerState)}`" />
              {{ smartModePowerState }}
            </template>
          </UiLabelValue>
          <!-- Pools -->
          <template v-if="smartModePools !== undefined">
            <BackupJobSmartModePools :label="t('resident-on')" :pools="smartModePools.included" />
            <BackupJobSmartModePools :label="t('not-resident-on')" :pools="smartModePools.excluded" />
          </template>
          <!-- Tags -->
          <template v-if="smartModeTags !== undefined">
            <UiLabelValue :label="t('vms-tags')" :value="smartModeTags.included ?? []" ellipsis />
            <UiLabelValue :label="t('excluded-vms-tags')" :value="smartModeTags.excluded ?? []" ellipsis />
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
import { useXoBackedUpVmsUtils } from '@/composables/xo-backed-up-vms-utils.composable'
import type { XoVmBackupJob } from '@/types/xo/vm-backup-job.type.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { toLower } from 'lodash-es'
import { useI18n } from 'vue-i18n'

const { backedUpVms: rawBackedUpVms } = defineProps<{
  backedUpVms: XoVmBackupJob['vms']
}>()

const { t } = useI18n()

const { backedUpVms, backedUpVmsCount, smartModePools, smartModePowerState, smartModeTags, isSmartModeEnabled } =
  useXoBackedUpVmsUtils(() => rawBackedUpVms)
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
