<template>
  <DetailPageLayout>
    <template #alert>
      <PrivilegeInfoAlert />
    </template>
    <template #menu="{ size }">
      <UiMenuItem
        :size
        :to="{ name: '/admin/privilege/[id]/general', params: { id: privilege.id } }"
        :selected="route.name === '/admin/privilege/[id]/general'"
      >
        {{ t('general') }}
      </UiMenuItem>
    </template>
    <slot />
  </DetailPageLayout>
</template>

<script lang="ts" setup>
import PrivilegeInfoAlert from '@/modules/role/components/privilege/PrivilegeInfoAlert.vue'
import DetailPageLayout from '@/shared/components/DetailPageLayout.vue'
import UiMenuItem from '@core/components/ui/menu-item/UiMenuItem.vue'
import type { XoAclBasePrivilege } from '@vates/types'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

defineProps<{
  privilege: XoAclBasePrivilege
}>()

defineSlots<{
  default(): any
}>()

const { t } = useI18n()

const route = useRoute()
</script>
