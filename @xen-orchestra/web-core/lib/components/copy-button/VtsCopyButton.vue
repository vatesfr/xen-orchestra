<template>
  <UiButtonIcon
    v-tooltip="copied && $t('core.copied')"
    :icon="icon"
    size="medium"
    accent="brand"
    @click="copyFunction()"
  />
</template>

<script setup lang="ts">
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faCheckCircle, faCopy } from '@fortawesome/free-solid-svg-icons'
import { useClipboard } from '@vueuse/core'
import { ref } from 'vue'

const { value } = defineProps<{
  value: string
}>()

const { copy, copied } = useClipboard()

const icon = ref(faCopy)
let timer: ReturnType<typeof setTimeout>

function copyFunction() {
  copy(value)

  icon.value = faCheckCircle
  clearTimeout(timer)

  timer = setTimeout(() => {
    icon.value = faCopy
    // 1.5s is time to toltips is visible
  }, 1_500)
}
</script>
