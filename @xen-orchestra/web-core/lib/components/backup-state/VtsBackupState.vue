<template>
  <UiInfo v-if="currentState" :accent="currentState.accent" class="vts-backup-state">
    {{ currentState.text }}
  </UiInfo>
</template>

<script lang="ts" setup>
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import { computed, type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { state } = defineProps<{
  state: BackupState | undefined
}>()

const { t } = useI18n()

type BackupState = 'success' | 'failure' | 'skipped' | 'interrupted'

type BackupStateMap = Record<BackupState, { text: string; accent: InfoAccent }>

const states: ComputedRef<BackupStateMap> = computed(() => ({
  success: { text: t('success'), accent: 'success' },
  failure: { text: t('failure'), accent: 'danger' },
  skipped: { text: t('skipped'), accent: 'warning' },
  interrupted: { text: t('interrupted'), accent: 'danger' },
}))

const currentState = computed(() => (state ? states.value[state] : undefined))
</script>

<style lang="postcss" scoped>
.vts-backup-state {
  font-size: 1rem;
}
</style>
