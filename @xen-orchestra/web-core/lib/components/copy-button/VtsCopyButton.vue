<template>
  <UiButtonIcon v-tooltip="copied && t('core.copied')" :icon size="medium" accent="brand" @click="copy()" />
</template>

<script setup lang="ts">
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faCheckCircle, faCopy } from '@fortawesome/free-solid-svg-icons'
import { useClipboard } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { value } = defineProps<{
  value: string
}>()

const { t } = useI18n()

const { copy, copied } = useClipboard({ source: () => value })

const icon = computed(() => (copied.value ? faCheckCircle : faCopy))
</script>
