<template>
  <UiPanelCard>
    <UiPanelCardTitle size="medium" :label="t('smb')" />
    <VtsCardRowList>
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
    </VtsCardRowList>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import {
  formatMountOptions,
  formatSmbPathOnShare,
  MASKED_SECRET,
} from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardRowList from '@core/components/card/VtsCardRowList.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ParsedSmbBackupRepositoryUrl } from 'xo-remote-parser'

const { smb, options } = defineProps<{
  smb: ParsedSmbBackupRepositoryUrl
  options?: string
}>()

const { t } = useI18n()

const pathOnShare = computed(() => formatSmbPathOnShare(smb.host, smb.path))

const formattedOptions = computed(() => formatMountOptions(options))
</script>
