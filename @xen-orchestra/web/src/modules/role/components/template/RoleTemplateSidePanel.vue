<template>
  <VtsSidePanel :has-selection="roleTemplate !== undefined" @close="emit('close')">
    <template v-if="newRoleRoute" #actions>
      <UiLink :to="newRoleRoute" icon="fa:plus" size="medium">
        {{ t('action:use-template') }}
      </UiLink>
    </template>
    <template v-if="roleTemplate" #default>
      <RoleInfosCard :role="roleTemplate" />
      <RolePrivilegesCard :role="roleTemplate" />
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import RoleInfosCard from '@/modules/role/components/list/panel/cards/RoleInfosCard.vue'
import RolePrivilegesCard from '@/modules/role/components/list/panel/cards/RolePrivilegesCard.vue'
import type { FrontXoRoleTemplate } from '@/modules/role/remote-resources/use-xo-role-template-collection.ts'
import { getNewRoleFromTemplateRoute } from '@/modules/role/utils/role-template.util.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { roleTemplate } = defineProps<{
  roleTemplate?: FrontXoRoleTemplate
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

const newRoleRoute = computed(() =>
  roleTemplate !== undefined ? getNewRoleFromTemplateRoute(roleTemplate.id) : undefined
)
</script>
