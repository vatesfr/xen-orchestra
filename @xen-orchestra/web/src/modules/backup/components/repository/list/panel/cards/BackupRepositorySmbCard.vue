<template>
  <UiPanelCard class="card-container">
    <UiCardTitle>{{ t('smb') }}</UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('path-on-share') }}</template>
        <template #value>{{ pathOnShare }}</template>
        <template #addons>
          <VtsCopyButton :value="pathOnShare" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue>
        <template #key>{{ t('username') }}</template>
        <template #value>{{ smb.username }}</template>
        <template #addons>
          <VtsCopyButton :value="smb.username" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue>
        <template #key>{{ t('password') }}</template>
        <template #value>{{ MASKED_SECRET }}</template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue>
        <template #key>{{ t('domain') }}</template>
        <template #value>{{ smb.domain }}</template>
        <template #addons>
          <VtsCopyButton :value="smb.domain" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue>
        <template #key>{{ t('custom-options') }}</template>
        <template #value>{{ formatedOptions }}</template>
        <template v-if="formatedOptions" #addons>
          <VtsCopyButton :value="formatedOptions" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { type SmbBackupRepositoryInfo } from '@/modules/backup/utils/xo-backup-repository-url.util.ts'
import { MASKED_SECRET, formatMountOptions } from '@/modules/backup/utils/xo-backup-repository.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { smb, options } = defineProps<{
  smb: SmbBackupRepositoryInfo
  options?: string
}>()

const { t } = useI18n()

const pathOnShare = computed(() => `${smb.host}\\${smb.path}`)

const formatedOptions = computed(() => formatMountOptions(options))
</script>

<style scoped lang="postcss">
.card-container {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
