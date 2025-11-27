<template>
  <li>
    <UiLink size="small" icon="fa:database" :href="`${xo5Route}#/srs/${sr.id}/general`">
      {{ sr.name_label }}
    </UiLink>
  </li>
</template>

<script setup lang="ts">
import { useXoRoutes } from '@/remote-resources/use-xo-routes.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import type { XoSr } from '@vates/types'
import { computed } from 'vue'

const { sr } = defineProps<{
  sr: XoSr
}>()

const { routes } = useXoRoutes()
const xo5Route = computed(() => routes.value?.xo5 ?? '/')
</script>
