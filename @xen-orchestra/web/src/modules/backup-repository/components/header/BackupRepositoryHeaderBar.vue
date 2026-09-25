<template>
  <UiHeadBar>
    {{ br.name }}
    <template #icon>
      <VtsIcon size="medium" :name="brIcon" />
    </template>
  </UiHeadBar>
</template>

<script setup lang="ts">
import { useXoBackupRepositoryParsedUrl } from '@/modules/backup-repository/composables/use-xo-backup-repository-parsed-url.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { getBackupRepositoryIcon } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { computed } from 'vue'

const { br } = defineProps<{
  br: FrontXoBackupRepository
}>()

const parsedUrl = useXoBackupRepositoryParsedUrl(() => br)

const brIcon = computed(() => getBackupRepositoryIcon(br, parsedUrl.value?.type))
</script>
