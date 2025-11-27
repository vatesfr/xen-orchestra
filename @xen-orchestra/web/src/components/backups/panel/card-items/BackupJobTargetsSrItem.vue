<template>
  <li>
    <UiLink size="small" icon="fa:database" :href="`/#/srs/${sr.id}/general`">
      {{ sr.name_label }}
    </UiLink>
  </li>
</template>

<script setup lang="ts">
import UiLink from '@core/components/ui/link/UiLink.vue'
import type { XoSr } from '@vates/types'

const { sr } = defineProps<{
  sr: XoSr
}>()
</script>
