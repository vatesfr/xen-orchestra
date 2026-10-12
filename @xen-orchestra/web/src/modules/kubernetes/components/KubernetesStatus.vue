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
    ['ready', { text: t('ready'), accent: 'success' }],
    ['partially-ready', { text: t('partially-ready'), accent: 'warning' }],
    ['not-ready', { text: t('not-ready'), accent: 'danger' }],
    ['Provisioned', { text: t('provisioned'), accent: 'success' }],
    ['Provisioning', { text: t('provisioning'), accent: 'info' }],
    ['Running', { text: t('running'), accent: 'success' }],
    ['Pending', { text: t('pending'), accent: 'info' }],
    ['Updating', { text: t('updating'), accent: 'info' }],
    ['Failed', { text: t('failed'), accent: 'danger' }],
    ['Deleted', { text: t('deleted'), accent: 'danger' }],
    ['Deleting', { text: t('deleting'), accent: 'info' }],
    ['Unknown', { text: t('unknown'), accent: 'muted' }],
    [true, { text: t('enabled'), accent: 'success' }],
    [false, { text: t('disabled'), accent: 'muted' }],
  ],
  false
)
</script>
