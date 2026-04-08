<template>
  <UiCard>
    <UiTitle>
      {{ t('configuration') }}
    </UiTitle>
    <template v-if="!isSmartModeEnabled">
      <VtsTabularKeyValueList>
        <VtsTabularKeyValueRow :label="t('smart-mode')">
          <template #value>
            <VtsStatus status="disabled" />
          </template>
        </VtsTabularKeyValueRow>
      </VtsTabularKeyValueList>
    </template>
    <VtsColumns v-else>
      <VtsTabularKeyValueList>
        <VtsTabularKeyValueRow :label="t('smart-mode')">
          <template #value>
            <VtsStatus status="enabled" />
          </template>
        </VtsTabularKeyValueRow>
        <VtsTabularKeyValueRow :label="t('vms-tags')">
          <template v-if="smartModeTags?.included !== undefined && smartModeTags.included.length > 0" #value>
            <UiTagsList>
              <UiTag v-for="tag in smartModeTags.included" :key="tag" accent="info" variant="secondary">
                {{ tag }}
              </UiTag>
            </UiTagsList>
          </template>
        </VtsTabularKeyValueRow>
      </VtsTabularKeyValueList>
      <VtsTabularKeyValueList>
        <VtsTabularKeyValueRow :label="t('resident-on')">
          <template v-if="smartModePools !== undefined" #value>
            <UiLink
              v-for="pool in smartModePools.included"
              :key="pool.id"
              size="small"
              icon="object:pool"
              :to="{ name: '/pool/[id]/dashboard', params: { id: pool.id } }"
            >
              {{ pool.name_label }}
            </UiLink>
          </template>
        </VtsTabularKeyValueRow>
        <VtsTabularKeyValueRow :label="t('excluded-vms-tags')">
          <template v-if="smartModeTags !== undefined && smartModeTags.excluded.length > 0" #value>
            <UiTagsList>
              <UiTag v-for="tag in smartModeTags.excluded" :key="tag" accent="info" variant="secondary">
                {{ tag }}
              </UiTag>
            </UiTagsList>
          </template>
        </VtsTabularKeyValueRow>
      </VtsTabularKeyValueList>
      <VtsTabularKeyValueList>
        <VtsTabularKeyValueRow :label="t('not-resident-on')">
          <template v-if="smartModePools !== undefined" #value>
            <UiLink
              v-for="pool in smartModePools.excluded"
              :key="pool.id"
              size="small"
              icon="object:pool"
              :to="{ name: '/pool/[id]/dashboard', params: { id: pool.id } }"
            >
              {{ pool.name_label }}
            </UiLink>
          </template>
        </VtsTabularKeyValueRow>
        <VtsTabularKeyValueRow :label="t('power-state')">
          <template v-if="smartModePowerState !== undefined" #value>
            <VtsIcon size="small" :name="`object:vm:${toLower(smartModePowerState)}`" />
            {{ smartModePowerState }}
          </template>
        </VtsTabularKeyValueRow>
      </VtsTabularKeyValueList>
    </VtsColumns>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoBackedUpVmsUtils } from '@/modules/backup/composables/xo-backed-up-vms-utils.composable.ts'
import type { FrontXoVmBackupJob } from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { toLower } from 'lodash-es'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: FrontXoVmBackupJob
}>()

const { t } = useI18n()

const { isSmartModeEnabled, smartModePools, smartModeTags, smartModePowerState } = useXoBackedUpVmsUtils(
  () => backupJob.vms
)
</script>
