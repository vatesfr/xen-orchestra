<template>
  <div class="new-backup-repository-review-step">
    <div class="section">
      <UiTitle>
        {{ t('br-details') }}
        <template #action>
          <UiButton
            variant="tertiary"
            accent="brand"
            size="medium"
            left-icon="action:edit"
            @click="emit('edit', 'general')"
          >
            {{ t('action:edit') }}
          </UiButton>
        </template>
      </UiTitle>

      <VtsTabularKeyValueList>
        <VtsTabularKeyValueRow :label="t('name')" :value="general.formData.name" />
        <VtsTabularKeyValueRow :label="t('type')" :value="typeLabel" />
        <VtsTabularKeyValueRow :label="t('backup-format')" :value="backupFormatLabel" />
        <VtsTabularKeyValueRow :label="t('proxy')">
          <template v-if="proxy" #value>
            <VtsIcon name="object:proxy" size="medium" />
            {{ proxy.name }}
          </template>
        </VtsTabularKeyValueRow>
        <VtsTabularKeyValueRow :label="t('encryption')">
          <template #value>
            <VtsStatus :status="general.formData.encrypted" />
          </template>
        </VtsTabularKeyValueRow>
      </VtsTabularKeyValueList>
    </div>

    <div class="section">
      <UiTitle>
        {{ detailsTitle }}
        <template #action>
          <UiButton
            variant="tertiary"
            accent="brand"
            size="medium"
            left-icon="action:edit"
            @click="emit('edit', 'details')"
          >
            {{ t('action:edit') }}
          </UiButton>
        </template>
      </UiTitle>

      <VtsTabularKeyValueList>
        <BackupRepositoryLocalReview v-if="type === 'file'" :form="details.file" />
        <BackupRepositoryNfsReview v-else-if="type === 'nfs'" :form="details.nfs" />
        <BackupRepositorySmbReview v-else-if="type === 'smb'" :form="details.smb" />
        <BackupRepositoryS3Review v-else-if="type === 's3'" :form="details.s3" />
        <BackupRepositoryAzureReview
          v-else-if="type === 'azure' || type === 'azurite'"
          :form="details.azure"
          :is-azurite="type === 'azurite'"
        />
      </VtsTabularKeyValueList>
    </div>
  </div>
</template>

<script lang="ts" setup>
import BackupRepositoryAzureReview from '@/modules/backup-repository/components/form/review/BackupRepositoryAzureReview.vue'
import BackupRepositoryLocalReview from '@/modules/backup-repository/components/form/review/BackupRepositoryLocalReview.vue'
import BackupRepositoryNfsReview from '@/modules/backup-repository/components/form/review/BackupRepositoryNfsReview.vue'
import BackupRepositoryS3Review from '@/modules/backup-repository/components/form/review/BackupRepositoryS3Review.vue'
import BackupRepositorySmbReview from '@/modules/backup-repository/components/form/review/BackupRepositorySmbReview.vue'
import { useXoBackupRepositoryTypeLabel } from '@/modules/backup-repository/composables/use-xo-backup-repository-type-label.composable.ts'
import type { BackupRepositoryGeneralForm } from '@/modules/backup-repository/form/use-backup-repository-general-form.ts'
import type { NewBackupRepositoryDetailsForms } from '@/modules/backup-repository/form/use-new-backup-repository-form.ts'
import { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { general } = defineProps<{
  general: BackupRepositoryGeneralForm
  details: NewBackupRepositoryDetailsForms
  detailsTitle: string
}>()

const emit = defineEmits<{
  edit: [step: 'general' | 'details']
}>()

const { t } = useI18n()

const { useGetProxyById } = useXoProxyCollection()

const proxy = useGetProxyById(() => general.formData.proxy)

const type = computed(() => general.formData.type)

const typeLabel = useXoBackupRepositoryTypeLabel(type)

const backupFormatLabel = computed(() => general.getBackupFormatLabel(general.formData.backupFormat))
</script>

<style lang="postcss" scoped>
.new-backup-repository-review-step {
  display: flex;
  flex-direction: column;
  gap: 4.8rem;
  margin-block-start: 2.4rem;
  text-align: left;

  .section {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }
}
</style>
