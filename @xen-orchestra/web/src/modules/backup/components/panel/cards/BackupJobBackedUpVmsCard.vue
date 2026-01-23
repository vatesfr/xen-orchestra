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
              <span class="smart-mode-power-state-value">
                <VtsIcon size="small" :name="`object:vm:${toLower(smartModePowerState)}`" />
                {{ smartModePowerState }}
              </span>
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
            <UiLink size="small" :icon="`object:vm:${toLower(vm.power_state)}`" :to="`/vm/${vm.id}/dashboard`">
              {{ vm.name_label }}
            </UiLink>
          </li>
        </UiCollapsibleList>
      </template>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import BackupJobSmartModePools from '@/modules/backup/components/panel/card-items/BackupJobSmartModePools.vue'
import BackupJobSmartModeTags from '@/modules/backup/components/panel/card-items/BackupJobSmartModeTags.vue'
import { useXoBackedUpVmsUtils } from '@/modules/backup/composables/xo-backed-up-vms-utils.composable.ts'
import type { FrontXoVmBackupJob } from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
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
import { useI18n } from 'vue-i18n'

const { backedUpVms: rawBackedUpVms } = defineProps<{
  backedUpVms: FrontXoVmBackupJob['vms']
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

    .smart-mode-power-state-value {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }
  }
}
</style>
