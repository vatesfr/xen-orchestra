<template>
  <UiPanelCard class="role-privileges-card">
    <UiPanelCardTitle
      size="medium"
      :label="t('privileges')"
      :counter="arePrivilegesReady ? privileges.length : undefined"
    />

    <VtsStateHero v-if="hasPrivilegeFetchError" type="error" format="card" horizontal size="extra-small">
      {{ t('error-no-data') }}
    </VtsStateHero>

    <VtsStateHero v-else-if="!arePrivilegesReady" type="busy" format="card" horizontal size="extra-small" />

    <UiCollapsibleList v-else-if="privileges.length > 0" tag="div" :total-items="privileges.length">
      <div v-for="(privilege, index) of privileges" :key="privilege.id" class="privilege">
        <UiPanelCardTitle size="small" :label="t('privilege-number', { n: index + 1 })" />
        <PrivilegeDetailsRows :privilege />
      </div>
    </UiCollapsibleList>

    <VtsStateHero v-else type="no-data" format="card" horizontal size="extra-small">
      {{ t('no-privilege-attached') }}
    </VtsStateHero>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import PrivilegeDetailsRows from '@/modules/role/components/privilege/PrivilegeDetailsRows.vue'
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import { useXoRolePrivilegesCollection } from '@/modules/role/remote-resources/use-xo-role-privileges-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { useI18n } from 'vue-i18n'

const { role } = defineProps<{
  role: FrontXoRole
}>()

const { t } = useI18n()

const { privileges, arePrivilegesReady, hasPrivilegeFetchError } = useXoRolePrivilegesCollection({}, () => role.id)
</script>

<style scoped lang="postcss">
.role-privileges-card {
  .privilege {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding-block-end: 1.6rem;
    border-block-end: 0.1rem solid var(--color-neutral-border);

    &:last-child {
      padding-block-end: 0;
      border-block-end: none;
    }
  }
}
</style>
