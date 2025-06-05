<template>
  <UiButtonIcon v-tooltip="copied && $t('core.copied')" :icon size="medium" accent="brand" @click="copyToClipboard()" />
</template>

<script setup lang="ts">
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faCheckCircle, faCopy } from '@fortawesome/free-solid-svg-icons'
import { useClipboard, useTimeoutFn } from '@vueuse/core'
import { ref } from 'vue'

const { value } = defineProps<{
  value: string
}>()

const { copy, copied } = useClipboard()

const icon = ref(faCopy)

const { start: changeIcon } = useTimeoutFn(() => {
  icon.value = faCopy
}, 1_500) // 1.5s is time to Tooltip is visible

function copyToClipboard() {
  copy(value)
  icon.value = faCheckCircle
  changeIcon()
}
</script>
