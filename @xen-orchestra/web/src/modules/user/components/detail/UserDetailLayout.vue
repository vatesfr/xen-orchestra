<template>
  <DetailPageLayout>
    <template #alert>
      <UserRolesAlert />
    </template>
    <template #menu="{ size }">
      <UiMenuItem
        :size
        :to="{ name: '/admin/user/[id]/general', params: { id: user.id } }"
        :selected="route.name === '/admin/user/[id]/general'"
      >
        {{ t('general') }}
      </UiMenuItem>
      <UiMenuItem
        :size
        :to="{ name: '/admin/user/[id]/groups', params: { id: user.id } }"
        :selected="route.name === '/admin/user/[id]/groups'"
      >
        {{ t('groups') }}
      </UiMenuItem>
    </template>
    <slot />
    <template v-if="slots.panel" #panel>
      <slot name="panel" />
    </template>
  </DetailPageLayout>
</template>

<script lang="ts" setup>
import UserRolesAlert from '@/modules/user/components/UserRolesAlert.vue'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import DetailPageLayout from '@/shared/components/DetailPageLayout.vue'
import UiMenuItem from '@core/components/ui/menu-item/UiMenuItem.vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

defineProps<{
  user: FrontXoUser
}>()

const slots = defineSlots<{
  default(): any
  panel?(): any
}>()

const { t } = useI18n()

const route = useRoute()
</script>
