<template>
  <div class="breadcrumb-container">
    <UiBreadcrumb :size>
      <UiLink :size to="/dashboard" icon="fa:satellite">{{ XOA_NAME }}</UiLink>
      <UiLink :size to="/backups">{{ t('backups') }}</UiLink>
      <span class="backup-job-name">
        <VtsIcon name="object:backup-job" size="current" />
        {{ backupJob.name }}
      </span>
    </UiBreadcrumb>
    <UiLink :size :href="`${xo5Route}#/backup/new`">{{ t('configure-in-xo-5') }}</UiLink>
  </div>
  <TabList>
    <RouterLink v-slot="{ isActive, href }" :to="`/backup/${backupJob.id}/runs`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('runs') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="`/backup/${backupJob.id}/configuration`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('configuration') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="`/backup/${backupJob.id}/backed-up-vms`" custom>
      <TabItem :active="isActive" :href tag="a" :disabled="backupJob.type !== 'backup'">
        {{ t('backed-up-vms') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="`/backup/${backupJob.id}/targets`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('backup-targets') }}
      </TabItem>
    </RouterLink>
  </TabList>
</template>

<script lang="ts" setup>
import { XOA_NAME } from '@/constants'
import { useXoRoutes } from '@/remote-resources/use-xo-routes.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiBreadcrumb from '@core/components/ui/breadcrumb/UiBreadcrumb.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useUiStore } from '@core/stores/ui.store'
import type { AnyXoBackupJob } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{ backupJob: AnyXoBackupJob }>()

const { t } = useI18n()
const uiStore = useUiStore()

const { routes } = useXoRoutes()
const xo5Route = computed(() => routes.value?.xo5 ?? '/')

const size = computed(() => (uiStore.isMobile ? 'small' : 'medium'))
</script>

<style lang="postcss" scoped>
.breadcrumb-container {
  min-height: 5.6rem;
  padding: 1.2rem 1.6rem;
  display: flex;
  gap: 1.6rem;
  align-items: center;
  border-bottom: 0.1rem solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-primary);
  justify-content: space-between;
  overflow-y: scroll;

  .backup-job-name {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
