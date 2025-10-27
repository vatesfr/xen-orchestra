<template>
  <li>
    <UiLink size="small" :icon href="/#/settings/remotes">
      {{ br.name }}
    </UiLink>
  </li>
</template>

<script setup lang="ts">
import type { XoBackupRepository } from '@/types/xo/br.type.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'

const { br } = defineProps<{
  br: XoBackupRepository
}>()

const icon = computed(() =>
  br.enabled ? 'object:backup-repository:connected' : 'object:backup-repository:disconnected'
)
</script>
