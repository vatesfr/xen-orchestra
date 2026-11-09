<template>
  <DetailPageLayout>
    <template #alert>
      <RoleInfoAlert />
    </template>
    <template #menu="{ size }">
      <UiMenuItem
        :size
        :to="{ name: '/admin/role/[id]/general', params: { id: role.id } }"
        :selected="route.name === '/admin/role/[id]/general'"
      >
        {{ t('general') }}
      </UiMenuItem>
      <UiMenuItem
        :size
        :to="{ name: '/admin/role/[id]/users', params: { id: role.id } }"
        :selected="route.name === '/admin/role/[id]/users'"
      >
        {{ t('users') }}
      </UiMenuItem>
      <UiMenuItem
        :size
        :to="{ name: '/admin/role/[id]/groups', params: { id: role.id } }"
        :selected="route.name === '/admin/role/[id]/groups'"
      >
        {{ t('groups') }}
      </UiMenuItem>
      <UiMenuItem
        :size
        :to="{ name: '/admin/role/[id]/privileges', params: { id: role.id } }"
        :selected="route.name === '/admin/role/[id]/privileges'"
      >
        {{ t('privileges') }}
      </UiMenuItem>
    </template>
    <slot />
    <template v-if="slots.panel" #panel>
      <slot name="panel" />
    </template>
  </DetailPageLayout>
</template>

<script lang="ts" setup>
import RoleInfoAlert from '@/modules/role/components/RoleInfoAlert.vue'
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import DetailPageLayout from '@/shared/components/DetailPageLayout.vue'
import UiMenuItem from '@core/components/ui/menu-item/UiMenuItem.vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

defineProps<{
  role: FrontXoRole
}>()

const slots = defineSlots<{
  default(): any
  panel?(): any
}>()

const { t } = useI18n()

const route = useRoute()
</script>
