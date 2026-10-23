<template>
  <UiPanelCard>
    <UiPanelCardTitle
      :id="privilege.id"
      size="medium"
      :label="t('privilege-number', { n: number })"
      icon="fa:certificate"
      :to="{ name: '/admin/privilege/[id]/general', params: { id: privilege.id } }"
    />
    <PrivilegeDetailsRows :privilege />
  </UiPanelCard>
</template>

<script lang="ts" setup>
import PrivilegeDetailsRows from '@/modules/role/components/privilege/PrivilegeDetailsRows.vue'
import type { FrontXoPrivilege } from '@/modules/role/remote-resources/use-xo-role-privileges-collection.ts'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  privilege: FrontXoPrivilege
  number: number
}>()

const { t } = useI18n()
</script>
