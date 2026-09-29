<template>
  <UiDrawer @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('edit-br') }}
    </template>

    <template #content>
      <BackupRepositoryGeneralStep :bindings="general.bindings" />
      <div v-if="general.formData.type !== undefined" class="details-section">
        <UiTitle>{{ t('br-type-details', { type: typeLabel }) }}</UiTitle>
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
import { useXoBackupRepositoryTypeLabel } from '@/modules/backup-repository/composables/use-xo-backup-repository-type-label.composable.ts'
import { useEditBackupRepositoryForm } from '@/modules/backup-repository/form/use-edit-backup-repository-form.ts'
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
  confirm: []
  cancel: []
}>()

const { t } = useI18n()

const { general, details, validate } = useEditBackupRepositoryForm(() => br)

const typeLabel = useXoBackupRepositoryTypeLabel(() => general.formData.type)

async function handleConfirm() {
  if (await validate()) {
    emit('confirm')
  }
}
</script>

<style lang="postcss" scoped>
.details-section {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  margin-block-start: 4.8rem;
  text-align: left;

  .details-step {
    margin-block-start: 0;
  }
}
</style>
