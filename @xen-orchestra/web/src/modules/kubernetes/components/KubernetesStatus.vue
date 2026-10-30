<template>
  <UiInfo v-tooltip="iconOnly ? currentStatus.text : false" :accent="currentStatus.accent">
    <template v-if="!iconOnly">{{ currentStatus.text }}</template>
  </UiInfo>
</template>

<script setup lang="ts">
import type { KubernetesStatus } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useMapper } from '@core/packages/mapper'
import { useI18n } from 'vue-i18n'

const { status } = defineProps<{
  status: KubernetesStatus
  iconOnly?: boolean
}>()

const { t } = useI18n()

const currentStatus = useMapper<KubernetesStatus, { text: string; accent: InfoAccent }>(
  () => status,
  () => [
    ['available', { text: t('available'), accent: 'success' }],
    ['not-available', { text: t('not-available'), accent: 'danger' }],
    ['ready', { text: t('ready'), accent: 'success' }],
    ['not-ready', { text: t('not-ready'), accent: 'danger' }],
    ['unknown', { text: t('unknown'), accent: 'muted' }],
    ['yes', { text: t('yes'), accent: 'success' }],
    ['no', { text: t('no'), accent: 'muted' }],
    ['paused', { text: t('paused'), accent: 'warning' }],
    ['Provisioned', { text: t('provisioned'), accent: 'success' }],
    ['Provisioning', { text: t('provisioning'), accent: 'info' }],
    ['Running', { text: t('running'), accent: 'success' }],
    ['Pending', { text: t('pending'), accent: 'info' }],
    ['Updating', { text: t('updating'), accent: 'info' }],
    ['Failed', { text: t('failed'), accent: 'danger' }],
    ['Deleted', { text: t('deleted'), accent: 'danger' }],
    ['Deleting', { text: t('deleting'), accent: 'info' }],
    ['Unknown', { text: t('unknown'), accent: 'muted' }],
    ['schedulable', { text: t('schedulable'), accent: 'success' }],
    ['cordoned', { text: t('cordoned'), accent: 'danger' }],
    ['draining', { text: t('draining'), accent: 'warning' }],
    [true, { text: t('enabled'), accent: 'success' }],
    [false, { text: t('disabled'), accent: 'muted' }],
  ],
  false
)
</script>
