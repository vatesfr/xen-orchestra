<template>
  <UiDrawer class="bulk-edit-backup-repositories-drawer" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('action:edit-n-brs', { n: brs.length }) }}
    </template>

    <template #content>
      <BackupRepositoryGeneralStep :bindings="general.bindings" hide-encryption />
      <div v-if="hasMixedTypes" class="details-section">
        <UiTitle>{{ t('details') }}</UiTitle>
        <UiAlert accent="info">{{ t('multi-edit-brs-different-types') }}</UiAlert>
      </div>
      <div v-else-if="general.formData.type !== undefined" class="details-section">
        <UiTitle>{{ detailsTitle }}</UiTitle>
        <BackupRepositoryDetailsStep class="details-step" :type="general.formData.type" :details />
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>
        {{ t('action:save') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import BackupRepositoryDetailsStep from '@/modules/backup-repository/components/form/steps/BackupRepositoryDetailsStep.vue'
import BackupRepositoryGeneralStep from '@/modules/backup-repository/components/form/steps/BackupRepositoryGeneralStep.vue'
import { useBulkEditBackupRepositoriesForm } from '@/modules/backup-repository/form/bulk-edit/use-bulk-edit-backup-repositories-form.ts'
import type { BulkEditBackupRepositoryPayloads } from '@/modules/backup-repository/jobs/xo-backup-repository-bulk-edit.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { brs } = defineProps<{
  brs: FrontXoBackupRepository[]
}>()

const emit = defineEmits<{
  confirm: [payloads: BulkEditBackupRepositoryPayloads]
  cancel: []
}>()

const { t } = useI18n()

const { general, details, detailsTitle, hasMixedTypes, validateAndBuildPayloads } = useBulkEditBackupRepositoriesForm(brs)

async function handleConfirm() {
  const payloads = await validateAndBuildPayloads()

  if (payloads !== undefined) {
    emit('confirm', payloads)
  }
}
</script>

<style lang="postcss" scoped>
.bulk-edit-backup-repositories-drawer {
  .details-section {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    margin-block-start: 4.8rem;
    text-align: start;

    .details-step {
      margin-block-start: 0;
    }
  }
}
</style>
