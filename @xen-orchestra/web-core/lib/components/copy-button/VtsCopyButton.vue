<template>
  <UiButtonIcon v-tooltip="copied && t('copied')" :icon size="small" accent="brand" @click="copy()" />
</template>

<script setup lang="ts">
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useClipboard } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { value } = defineProps<{
  value: string
}>()

const { t } = useI18n()

const { copy, copied } = useClipboard({ source: () => value, legacy: true })

const icon = computed(() => (copied.value ? 'fa:check-circle' : 'fa:copy'))

// TODO : Add warning if copy fails
</script>
