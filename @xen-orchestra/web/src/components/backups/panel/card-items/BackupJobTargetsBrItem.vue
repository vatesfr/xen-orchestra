<template>
  <li>
    <UiLink size="small" :icon href="/#/settings/remotes">
      {{ br.name }}
    </UiLink>
  </li>
</template>

<script setup lang="ts">
import UiLink from '@core/components/ui/link/UiLink.vue'
import type { XoBackupRepository } from '@vates/types'
import { computed } from 'vue'

const { br } = defineProps<{
  br: XoBackupRepository
}>()

const icon = computed(() =>
  br.enabled ? 'object:backup-repository:connected' : 'object:backup-repository:disconnected'
)
</script>
