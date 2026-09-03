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
        <VtsTabularKeyValueRow :label="t('type')" :value="getTypeLabel(general.formData.type)" />
        <VtsTabularKeyValueRow
          :label="t('storage-mode')"
          :value="general.formData.backupFormat === 'block' ? t('block-based') : t('vhd-file')"
        />
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
        <template v-if="type === 'file'">
          <VtsTabularKeyValueRow :label="t('path')" :value="details.file.formData.path" />
        </template>

        <template v-else-if="type === 'nfs'">
          <VtsTabularKeyValueRow :label="t('host')" :value="details.nfs.formData.host" />
          <VtsTabularKeyValueRow :label="t('port')" :value="nfsPort" />
          <VtsTabularKeyValueRow :label="t('path-on-share')" :value="details.nfs.formData.path" />
          <VtsTabularKeyValueRow :label="t('custom-options')" :value="details.nfs.formData.customOptions" />
        </template>

        <template v-else-if="type === 'smb'">
          <VtsTabularKeyValueRow :label="t('path-on-share')" :value="smbPath" />
          <VtsTabularKeyValueRow :label="t('username')" :value="details.smb.formData.username" />
          <VtsTabularKeyValueRow :label="t('password')" :value="maskedSmbPassword" />
          <VtsTabularKeyValueRow :label="t('domain')" :value="smbDomain" />
          <VtsTabularKeyValueRow :label="t('custom-options')" :value="details.smb.formData.customOptions" />
        </template>

        <template v-else-if="type === 's3'">
          <VtsTabularKeyValueRow :label="t('endpoint-url')" :value="details.s3.formData.endpoint" />
          <VtsTabularKeyValueRow :label="t('https')">
            <template #value>
              <VtsStatus :status="details.s3.formData.useHttps" />
            </template>
          </VtsTabularKeyValueRow>
          <VtsTabularKeyValueRow v-if="details.s3.formData.useHttps" :label="t('unauthorized')">
            <template #value>
              <VtsStatus :status="details.s3.formData.allowUnauthorized" />
            </template>
          </VtsTabularKeyValueRow>
          <VtsTabularKeyValueRow :label="t('region')" :value="details.s3.formData.region" />
          <VtsTabularKeyValueRow :label="t('access-key-id')" :value="details.s3.formData.accessKeyId" />
          <VtsTabularKeyValueRow :label="t('secret')" :value="maskedS3Secret" />
          <VtsTabularKeyValueRow :label="t('bucket-name')" :value="details.s3.formData.bucket" />
          <VtsTabularKeyValueRow :label="t('path-in-bucket')" :value="details.s3.formData.pathInBucket" />
        </template>

        <template v-else-if="type === 'azure' || type === 'azurite'">
          <VtsTabularKeyValueRow :label="t('host')" :value="details.azure.formData.hostName" />
          <VtsTabularKeyValueRow v-if="type === 'azurite'" :label="t('https')">
            <template #value>
              <VtsStatus :status="details.azure.formData.useHttps" />
            </template>
          </VtsTabularKeyValueRow>
          <VtsTabularKeyValueRow :label="t('account-name')" :value="details.azure.formData.accountName" />
          <VtsTabularKeyValueRow :label="t('key')" :value="maskedAzureKey" />
          <VtsTabularKeyValueRow :label="t('container-name')" :value="details.azure.formData.containerName" />
          <VtsTabularKeyValueRow :label="t('path')" :value="details.azure.formData.pathInContainer" />
        </template>
      </VtsTabularKeyValueList>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useXoBackupRepositoryUtils } from '@/modules/backup/composables/xo-backup-repository-utils.composable.ts'
import { NFS_DEFAULT_PORT } from '@/modules/backup/form/details/use-nfs-backup-repository-details-form.ts'
import { SMB_DEFAULT_DOMAIN } from '@/modules/backup/form/details/use-smb-backup-repository-details-form.ts'
import type { BackupRepositoryGeneralForm } from '@/modules/backup/form/use-backup-repository-general-form.ts'
import type { NewBackupRepositoryDetailsForms } from '@/modules/backup/form/use-new-backup-repository-form.ts'
import { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import VtsIcon from '@xen-orchestra/web-core/components/icon/VtsIcon.vue'
import VtsStatus from '@xen-orchestra/web-core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@xen-orchestra/web-core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@xen-orchestra/web-core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiButton from '@xen-orchestra/web-core/components/ui/button/UiButton.vue'
import UiTitle from '@xen-orchestra/web-core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { general, details } = defineProps<{
  general: BackupRepositoryGeneralForm
  details: NewBackupRepositoryDetailsForms
  detailsTitle: string
}>()

const emit = defineEmits<{
  edit: [step: 'general' | 'details']
}>()

const MASKED_VALUE = '•'.repeat(12)

const { t } = useI18n()

const { useGetProxyById } = useXoProxyCollection()

const { getTypeLabel } = useXoBackupRepositoryUtils()

const proxy = useGetProxyById(() => general.formData.proxy)

const type = computed(() => general.formData.type)

const nfsPort = computed(() => (details.nfs.formData.port !== '' ? details.nfs.formData.port : NFS_DEFAULT_PORT))

const smbDomain = computed(() =>
  details.smb.formData.domain !== '' ? details.smb.formData.domain : SMB_DEFAULT_DOMAIN
)

const smbPath = computed(() => {
  const { pathOnShare, subfolder } = details.smb.formData

  return `\\\\${pathOnShare}${subfolder !== '' ? `\\${subfolder}` : ''}`
})

function mask(value: string): string {
  return value !== '' ? MASKED_VALUE : ''
}

const maskedSmbPassword = computed(() => mask(details.smb.formData.password))
const maskedS3Secret = computed(() => mask(details.s3.formData.secret))
const maskedAzureKey = computed(() => mask(details.azure.formData.key))
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
