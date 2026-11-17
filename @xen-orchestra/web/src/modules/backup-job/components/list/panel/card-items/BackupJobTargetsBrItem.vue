<template>
  <li>
    <UiLink size="small" :icon :to="{ name: '/admin/backup-repository/[id]/general', params: { id: br.id } }">
      {{ br.name }}
    </UiLink>
  </li>
</template>

<script setup lang="ts">
import { useXoBackupRepositoryParsedUrl } from '@/modules/backup-repository/composables/use-xo-backup-repository-parsed-url.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { getBackupRepositoryIcon } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'

const { br } = defineProps<{
  br: FrontXoBackupRepository
}>()

const parsedBrUrl = useXoBackupRepositoryParsedUrl(() => br)

const icon = computed(() => getBackupRepositoryIcon(br, parsedBrUrl.value?.type))
</script>
