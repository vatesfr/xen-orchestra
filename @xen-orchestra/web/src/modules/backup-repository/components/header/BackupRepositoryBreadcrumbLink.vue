<template>
  <div class="backup-repository-breadcrumb-link">
    <UiBreadcrumb :size>
      <UiLink :size :to="{ name: '/admin/backup-and-replication/backup-repositories' }" icon="object:backup-archive">
        {{ t('backup-repositories') }}
      </UiLink>
      <span>
        {{ br.name }}
      </span>
    </UiBreadcrumb>
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import UiBreadcrumb from '@core/components/ui/breadcrumb/UiBreadcrumb.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  br: FrontXoBackupRepository
}>()

const uiStore = useUiStore()

const size = computed(() => (uiStore.isSmall ? 'small' : 'medium'))

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.backup-repository-breadcrumb-link {
  min-height: 5.6rem;
  padding: 1.2rem 1.6rem;
  display: flex;
  gap: 1.6rem;
  align-items: center;
  border-block-end: 0.1rem solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-primary);
  justify-content: space-between;
  overflow-y: auto;
}
</style>
