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
import { faCheckCircle, faCopy } from '@fortawesome/free-solid-svg-icons'
import { useClipboard } from '@vueuse/core'
import { ref } from 'vue'
import UiButtonIcon from '../button-icon/UiButtonIcon.vue'

const { copyElement } = defineProps<{
  copyElement: string
}>()
const { copy, copied } = useClipboard()

const icon = ref(faCopy)
let timer: ReturnType<typeof setTimeout>

const copyFunction = async () => {
  await copy(copyElement)
  icon.value = faCheckCircle
  clearTimeout(timer)
  timer = setTimeout(() => {
    icon.value = faCopy
  }, 2_000)
}
</script>
