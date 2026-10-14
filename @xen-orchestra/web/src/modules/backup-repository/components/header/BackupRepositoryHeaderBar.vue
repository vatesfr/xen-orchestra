<template>
  <UiHeadBar>
    {{ br.name }}
    <template #icon>
      <VtsIcon size="medium" :name="icon" />
    </template>
  </UiHeadBar>
</template>

<script setup lang="ts">
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { IconName } from '@core/icons'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'

defineProps<{
  br: FrontXoBackupRepository
  icon: IconName
}>()
</script>
