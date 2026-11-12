<template>
  <div class="backup-log-header-breadcrumb">
    <UiBreadcrumb :size>
      <UiLink :size :to="{ name: '/admin/backup-and-replication/logs' }" icon="object:backup-archive">
        {{ t('backup-and-replication') }}
      </UiLink>
      <UiLink :size :to="{ name: '/admin/backup-and-replication/logs' }">
        {{ t('logs') }}
      </UiLink>
      <span class="log-name">
        <VtsIcon name="object:backup-run" size="current" />
        {{ logName }}
      </span>
    </UiBreadcrumb>
  </div>
</template>

<script setup lang="ts">
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiBreadcrumb from '@core/components/ui/breadcrumb/UiBreadcrumb.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{ logName: string }>()

const { t } = useI18n()

const uiStore = useUiStore()

const size = computed(() => (uiStore.isSmall ? 'small' : 'medium'))
</script>

<style lang="postcss" scoped>
.backup-log-header-breadcrumb {
  min-height: 5.6rem;
  padding: 1.2rem 1.6rem;
  display: flex;
  gap: 1.6rem;
  align-items: center;
  border-block-end: 0.1rem solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-primary);
  justify-content: space-between;
  overflow-y: auto;

  .log-name {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
}
</style>
