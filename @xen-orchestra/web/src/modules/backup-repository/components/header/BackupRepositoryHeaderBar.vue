<template>
  <UiHeadBar>
    {{ br.name }}
    <template #icon>
      <VtsIcon size="medium" :name="icon" />
    </template>
    <template #actions>
      <UiButton
        size="medium"
        variant="secondary"
        accent="brand"
        left-icon="action:edit"
        @click="openEditBackupRepositoryDrawer(br)"
      >
        {{ t('action:edit') }}
      </UiButton>
    </template>
  </UiHeadBar>
</template>

<script setup lang="ts">
import { useEditBackupRepository } from '@/modules/backup-repository/composables/use-edit-backup-repository.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { IconName } from '@core/icons'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  br: FrontXoBackupRepository
  icon: IconName
}>()

const { t } = useI18n()

const { openEditBackupRepositoryDrawer } = useEditBackupRepository()
</script>
