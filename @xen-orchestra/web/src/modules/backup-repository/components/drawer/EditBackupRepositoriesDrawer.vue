<template>
  <UiDrawer class="edit-backup-repositories-drawer" @confirm="emit('confirm')" @dismiss="emit('cancel')">
    <template #title>
      {{ t('edit-n-brs', { n: brs.length }) }}
    </template>

    <template #content>
      <BackupRepositoryGeneralStep :bindings="general.bindings" />
      <div v-if="hasMixedTypes" class="details-section">
        <UiTitle>{{ t('details') }}</UiTitle>
        <UiAlert accent="info">{{ t('multi-edit-brs-different-types') }}</UiAlert>
      </div>
      <div v-else-if="general.formData.type !== undefined" class="details-section">
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
import { useEditBackupRepositoriesForm } from '@/modules/backup-repository/form/use-edit-backup-repositories-form.ts'
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

// TODO Emit the payloads once the editable fields are defined
const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()

const { general, details, hasMixedTypes } = useEditBackupRepositoriesForm(() => brs)

const typeLabel = useXoBackupRepositoryTypeLabel(() => general.formData.type)
</script>

<style lang="postcss" scoped>
.edit-backup-repositories-drawer {
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
