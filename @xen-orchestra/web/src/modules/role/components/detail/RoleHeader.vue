<template>
  <div class="role-header">
    <UiBreadcrumb :size>
      <span class="name">
        <VtsIcon name="object:organization" size="current" />
        {{ t('user-management') }}
      </span>
      <UiLink :size :to="{ name: '/admin/user-management/roles' }">
        {{ t('roles') }}
      </UiLink>
      <span class="name">
        <VtsIcon name="fa:key" size="current" />
        {{ role.name }}
      </span>
    </UiBreadcrumb>
  </div>
  <UiHeadBar icon="fa:key">
    {{ role.name }}
  </UiHeadBar>
</template>

<script lang="ts" setup>
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiBreadcrumb from '@core/components/ui/breadcrumb/UiBreadcrumb.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  role: FrontXoRole
}>()

const { t } = useI18n()

const uiStore = useUiStore()

const size = computed(() => (uiStore.isSmall ? 'small' : 'medium'))
</script>

<style lang="postcss" scoped>
.role-header {
  min-height: 5.6rem;
  padding: 1.2rem 1.6rem;
  display: flex;
  align-items: center;
  border-block-end: 0.1rem solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-primary);

  .name {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
