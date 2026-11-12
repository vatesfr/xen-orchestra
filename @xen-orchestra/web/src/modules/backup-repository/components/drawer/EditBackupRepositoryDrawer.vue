<template>
  <UiDrawer class="edit-backup-repository-drawer" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('action:edit-br') }}
    </template>

    <template #content>
      <BackupRepositoryGeneralStep :bindings="general.bindings" />
      <div class="details-section">
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
import { useEditBackupRepositoryForm } from '@/modules/backup-repository/form/edit/use-edit-backup-repository-form.ts'
import type { EditBackupRepositoryPayload } from '@/modules/backup-repository/jobs/xo-backup-repository-edit.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { br } = defineProps<{
  br: FrontXoBackupRepository
}>()

const emit = defineEmits<{
  confirm: [payload: EditBackupRepositoryPayload]
  cancel: []
}>()

const { t } = useI18n()

const { general, details, detailsTitle, validateAndBuildPayload } = useEditBackupRepositoryForm(br)

async function handleConfirm() {
  const payload = await validateAndBuildPayload()

  if (payload !== undefined) {
    emit('confirm', payload)
  }
}
</script>

<style lang="postcss" scoped>
.edit-backup-repository-drawer {
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
