<template>
  <UiInfo :accent>{{ t(`firewall:host-state:${state}`) }}</UiInfo>
</template>

<script lang="ts" setup>
import type { VdfHostState } from '@/modules/vdf/types.ts'
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { state } = defineProps<{
  state: VdfHostState
}>()

const { t } = useI18n()

const accents: Record<VdfHostState, InfoAccent> = {
  'up-to-date': 'success',
  behind: 'warning',
  rejected: 'danger',
  stale: 'danger',
  unknown: 'muted',
  disabled: 'muted',
}

const accent = computed(() => accents[state])
</script>
