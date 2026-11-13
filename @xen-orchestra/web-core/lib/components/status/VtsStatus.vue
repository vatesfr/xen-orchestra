<template>
  <UiInfo
    v-tooltip="iconOnly ? currentStatus.text : false"
    :accent="currentStatus.accent"
    :role="iconOnly ? 'img' : undefined"
    :aria-label="iconOnly ? currentStatus.text : undefined"
  >
    <template v-if="!iconOnly">{{ currentStatus.text }}</template>
  </UiInfo>
</template>

<script setup lang="ts">
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import { useStatusLabel } from '@core/composables/status-label.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useMapper } from '@core/packages/mapper'
import { computed } from 'vue'

export type Status =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'disconnecting'
  | 'partially-connected'
  | 'disconnected-from-physical-device'
  | 'physically-disconnected'
  | 'unable-to-connect-to-the-pool'
  | 'unable-to-connect'
  | 'success'
  | 'skipped'
  | 'interrupted'
  | 'failure'
  | 'pending'
  | 'enabled'
  | 'at-least-one-enabled'
  | 'disabled'
  | 'allow'
  | 'drop'
  | true
  | false

const { status } = defineProps<{
  status: Status
  iconOnly?: boolean
}>()

const { getStatusLabel } = useStatusLabel()

const accent = useMapper<Status, InfoAccent>(
  () => status,
  () => [
    ['connecting', 'info'],
    ['connected', 'success'],
    ['disconnected', 'danger'],
    ['disconnecting', 'info'],
    ['partially-connected', 'warning'],
    ['disconnected-from-physical-device', 'warning'],
    ['physically-disconnected', 'danger'],
    ['unable-to-connect-to-the-pool', 'danger'],
    ['unable-to-connect', 'danger'],
    ['success', 'success'],
    ['skipped', 'warning'],
    ['interrupted', 'danger'],
    ['failure', 'danger'],
    ['pending', 'info'],
    ['enabled', 'success'],
    ['at-least-one-enabled', 'success'],
    ['disabled', 'muted'],
    ['allow', 'success'],
    ['drop', 'danger'],
    [true, 'success'],
    [false, 'muted'],
  ],
  false
)

const currentStatus = computed(() => ({ text: getStatusLabel(status), accent: accent.value }))
</script>
