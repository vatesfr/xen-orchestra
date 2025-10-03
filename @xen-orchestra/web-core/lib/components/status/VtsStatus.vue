<template>
  <UiInfo v-tooltip="iconOnly ? currentStatus.text : false" class="vts-status" :accent="currentStatus.accent">
    <template v-if="!iconOnly">{{ currentStatus.text }}</template>
  </UiInfo>
</template>

<script setup lang="ts">
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useMapper } from '@core/packages/mapper'
import { useI18n } from 'vue-i18n'

export type Status =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'partially-connected'
  | 'disconnected-from-physical-device'
  | 'physically-disconnected'
  | 'unable-to-connect-to-the-pool'
  | 'success'
  | 'skipped'
  | 'interrupted'
  | 'failure'
  | 'pending'
  | 'enabled'
  | 'disabled'
  | true
  | false

const { status } = defineProps<{
  status: Status
  iconOnly?: boolean
}>()

const { t } = useI18n()

const currentStatus = useMapper<Status, { text: string; accent: InfoAccent }>(
  () => status,
  () => [
    ['connecting', { text: t('connecting'), accent: 'info' }],
    ['connected', { text: t('connected'), accent: 'success' }],
    ['disconnected', { text: t('disconnected'), accent: 'danger' }],
    ['partially-connected', { text: t('partially-connected'), accent: 'warning' }],
    ['disconnected-from-physical-device', { text: t('disconnected-from-physical-device'), accent: 'warning' }],
    ['physically-disconnected', { text: t('disconnected-from-physical-device'), accent: 'danger' }],
    ['unable-to-connect-to-the-pool', { text: t('unable-to-connect-to-the-pool'), accent: 'danger' }],
    ['success', { text: t('success'), accent: 'success' }],
    ['skipped', { text: t('skipped'), accent: 'warning' }],
    ['interrupted', { text: t('interrupted'), accent: 'danger' }],
    ['failure', { text: t('failure'), accent: 'danger' }],
    ['pending', { text: t('in-progress'), accent: 'info' }],
    ['enabled', { text: t('enabled'), accent: 'success' }],
    ['disabled', { text: t('disabled'), accent: 'muted' }],
    [true, { text: t('enabled'), accent: 'success' }],
    [false, { text: t('disabled'), accent: 'muted' }],
  ],
  false
)
</script>

<style lang="postcss" scoped>
.vts-status {
  align-items: center;
}
</style>
