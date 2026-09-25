<template>
  <UiHeadBar>
    {{ br.name }}
    <template #icon>
      <VtsIcon v-if="br" size="medium" :name="getBackupRepositoryIcon(br, parsedUrl?.type)" />
    </template>
  </UiHeadBar>
</template>

<script setup lang="ts">
import { useXoBackupRepositoryParsedUrl } from '@/modules/backup-repository/composables/use-xo-backup-repository-parsed-url.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { getBackupRepositoryIcon } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'

const { br } = defineProps<{
  br: FrontXoBackupRepository
}>()

const parsedUrl = useXoBackupRepositoryParsedUrl(() => br)
</script>
