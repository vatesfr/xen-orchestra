<template>
  <div class="privilege-header">
    <UiBreadcrumb :size>
      <span class="name">
        <VtsIcon name="object:organization" size="current" />
        {{ t('user-management') }}
      </span>
      <UiLink :size :to="{ name: '/admin/user-management/roles' }">
        {{ t('roles') }}
      </UiLink>
      <UiLink :size :to="{ name: '/admin/role/[id]/general', params: { id: role.id } }" icon="fa:key">
        {{ role.name }}
      </UiLink>
      <span class="name">
        <VtsIcon name="fa:certificate" size="current" />
        {{ name }}
      </span>
    </UiBreadcrumb>
  </div>
  <UiHeadBar icon="fa:certificate">
    {{ name }}
  </UiHeadBar>
</template>

<script lang="ts" setup>
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import { useXoRolePrivilegesCollection } from '@/modules/role/remote-resources/use-xo-role-privileges-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiBreadcrumb from '@core/components/ui/breadcrumb/UiBreadcrumb.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import type { XoAclBasePrivilege } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { role, privilege } = defineProps<{
  role: FrontXoRole
  privilege: XoAclBasePrivilege
}>()

const { t } = useI18n()

const { privileges: rolePrivileges } = useXoRolePrivilegesCollection({}, () => role.id)

const name = computed(() => {
  const index = rolePrivileges.value.findIndex(rolePrivilege => rolePrivilege.id === privilege.id)

  return index === -1 ? t('privilege') : t('privilege-number', { n: index + 1 })
})

const uiStore = useUiStore()

const size = computed(() => (uiStore.isSmall ? 'small' : 'medium'))
</script>

<style lang="postcss" scoped>
.privilege-header {
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
