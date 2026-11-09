<template>
  <UiPanelCard>
    <UiPanelCardTitle
      size="medium"
      :label="t('roles-applied')"
      :counter="areRolesReady ? groupRoles.length : undefined"
    />

    <VtsStateHero v-if="hasRoleFetchError" type="error" format="card" horizontal size="extra-small">
      {{ t('error-no-data') }}
    </VtsStateHero>

    <VtsStateHero v-else-if="!areRolesReady" type="busy" format="card" horizontal size="extra-small" />

    <UiLinkList
      v-else-if="groupRoles.length > 0"
      variant="vertical"
      :visible-items="5"
      :total-items="groupRoles.length"
    >
      <UiLink
        v-for="role of groupRoles"
        :key="role.id"
        icon="fa:key"
        size="small"
        :to="{ name: '/admin/user-management/roles', query: { id: role.id } }"
      >
        {{ role.name }}
      </UiLink>
    </UiLinkList>

    <VtsStateHero v-else type="no-data" format="card" horizontal size="extra-small">
      {{ t('no-role-applied') }}
    </VtsStateHero>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import { useXoRoleCollection } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLinkList from '@core/components/ui/link-list/UiLinkList.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { group } = defineProps<{
  group: FrontXoGroup
}>()

const { t } = useI18n()

const { roles, areRolesReady, hasRoleFetchError } = useXoRoleCollection()

const groupRoles = computed(() => roles.value.filter(role => role.groupIds.includes(group.id)))
</script>
