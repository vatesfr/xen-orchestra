<template>
  <UiPanelCard class="backup-repository-smb-card">
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
        <template #value>{{ formattedOptions }}</template>
        <template v-if="formattedOptions" #addons>
          <VtsCopyButton :value="formattedOptions" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { formatMountOptions, MASKED_SECRET } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ParsedSmbBackupRepositoryUrl } from 'xo-remote-parser'

const { smb, options } = defineProps<{
  smb: ParsedSmbBackupRepositoryUrl
  options?: string
}>()

const { t } = useI18n()

const pathOnShare = computed(() => `${smb.host}\\${smb.path}`)

const formattedOptions = computed(() => formatMountOptions(options))
</script>

<style scoped lang="postcss">
.backup-repository-smb-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
