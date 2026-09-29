<template>
  <UiButton
    size="medium"
    variant="tertiary"
    accent="brand"
    left-icon="action:edit"
    @click="openEditBackupRepositoryDrawer(br)"
  >
    {{ t('action:edit') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useEditBackupRepository } from '@/modules/backup-repository/composables/use-edit-backup-repository.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  br: FrontXoBackupRepository
}>()

const { t } = useI18n()

const { openEditBackupRepositoryDrawer } = useEditBackupRepository()
</script>
