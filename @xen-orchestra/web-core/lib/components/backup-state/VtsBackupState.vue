<template>
  <UiInfo :accent="state.accent" class="vts-backup-state">
    {{ state.text }}
  </UiInfo>
</template>

<script lang="ts" setup>
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import { useMapper } from '@core/packages/mapper'
import { useI18n } from 'vue-i18n'

const { state: _state } = defineProps<{
  state: BackupState
}>()

const { t } = useI18n()

type BackupState = 'success' | 'failure' | 'skipped' | 'interrupted'

const state = useMapper<BackupState, { text: string; accent: InfoAccent }>(
  () => _state,
  {
    success: { text: t('success'), accent: 'success' },
    failure: { text: t('failure'), accent: 'danger' },
    skipped: { text: t('skipped'), accent: 'warning' },
    interrupted: { text: t('interrupted'), accent: 'danger' },
  },
  'failure'
)
</script>

<style lang="postcss" scoped>
.vts-backup-state {
  font-size: 1rem;
}
</style>
