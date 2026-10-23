<template>
  <DetailPageLayout>
    <template #alert>
      <GroupInfoAlert />
    </template>
    <template #menu="{ size }">
      <UiMenuItem
        :size
        :to="{ name: '/admin/group/[id]/general', params: { id: group.id } }"
        :selected="route.name === '/admin/group/[id]/general'"
      >
        {{ t('general') }}
      </UiMenuItem>
      <UiMenuItem
        :size
        :to="{ name: '/admin/group/[id]/roles', params: { id: group.id } }"
        :selected="route.name === '/admin/group/[id]/roles'"
      >
        {{ t('roles') }}
      </UiMenuItem>
      <UiMenuItem
        :size
        :to="{ name: '/admin/group/[id]/users', params: { id: group.id } }"
        :selected="route.name === '/admin/group/[id]/users'"
      >
        {{ t('users') }}
      </UiMenuItem>
    </template>
    <slot />
    <template v-if="slots.panel" #panel>
      <slot name="panel" />
    </template>
  </DetailPageLayout>
</template>

<script lang="ts" setup>
import GroupInfoAlert from '@/modules/group/components/GroupInfoAlert.vue'
import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import DetailPageLayout from '@/shared/components/DetailPageLayout.vue'
import UiMenuItem from '@core/components/ui/menu-item/UiMenuItem.vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

defineProps<{
  group: FrontXoGroup
}>()

const slots = defineSlots<{
  default(): any
  panel?(): any
}>()

const { t } = useI18n()

const route = useRoute()
</script>
