<template>
  <UiHeadBar icon="fa:plus">
    {{ t('role:new-from-template') }}
  </UiHeadBar>

  <VtsContentSidePanel class="templates">
    <UiCard class="container">
      <RoleTemplatesTable :role-templates :busy="!areRoleTemplatesReady" :error="hasRoleTemplateFetchError" />
    </UiCard>

    <RoleTemplateSidePanel :role-template="selectedRoleTemplate" @close="selectedRoleTemplate = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import RoleTemplateSidePanel from '@/modules/role/components/template/RoleTemplateSidePanel.vue'
import RoleTemplatesTable from '@/modules/role/components/template/RoleTemplatesTable.vue'
import {
  type FrontXoRoleTemplate,
  useXoRoleTemplateCollection,
} from '@/modules/role/remote-resources/use-xo-role-template-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { roleTemplates, getRoleTemplateById, areRoleTemplatesReady, hasRoleTemplateFetchError } =
  useXoRoleTemplateCollection()

const selectedRoleTemplate = useRouteQuery<FrontXoRoleTemplate | undefined>('id', {
  toData: id => getRoleTemplateById(id as FrontXoRoleTemplate['id']),
  toQuery: roleTemplate => roleTemplate?.id ?? '',
})
</script>

<style scoped lang="postcss">
.templates {
  .container {
    height: fit-content;
    margin: 0.8rem;
  }
}
</style>
