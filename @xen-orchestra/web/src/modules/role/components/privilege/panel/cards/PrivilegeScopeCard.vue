<template>
  <UiPanelCard class="privilege-scope-card">
    <UiPanelCardTitle size="medium" :label="t('privilege:scope')" :counter="appliedToIds?.length" />
    <div class="rows">
      <VtsCardRowKeyValue>
        <template #key>{{ t('privilege:scope-type') }}</template>
        <template #value>{{ scopeTypeLabels[scopeType] }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="scopeType === 'dynamic-selection' && privilege.selector !== undefined" align-top>
        <template #key>{{ t('privilege:selector') }}</template>
        <template #value>{{ privilege.selector }}</template>
        <template #addons>
          <VtsCopyButton :value="privilege.selector" />
        </template>
      </VtsCardRowKeyValue>
    </div>
    <template v-if="selectableResource !== undefined && appliedToIds !== undefined">
      <UiPanelCardTitle size="small" :label="t('privilege:currently-applied-to')" />
      <VtsStateHero v-if="appliedToIds.length === 0" type="no-data" format="card" horizontal size="extra-small">
        {{ t('privilege:no-object') }}
      </VtsStateHero>
      <UiCollapsibleList v-else tag="div" :total-items="appliedToObjects.length">
        <UiLink v-for="object of appliedToObjects" :key="object.id" size="medium" :to="object.to" :icon="object.icon">
          {{ object.label }}
        </UiLink>
      </UiCollapsibleList>
    </template>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { usePrivilegeAppliedToIds } from '@/modules/role/composables/use-privilege-applied-to-ids.composable.ts'
import { usePrivilegeScopeObjectsByIds } from '@/modules/role/composables/use-privilege-scope-objects-by-ids.composable.ts'
import { usePrivilegeScopeTypeLabels } from '@/modules/role/composables/use-privilege-scope-type-labels.composable.ts'
import type { FrontXoPrivilege } from '@/modules/role/remote-resources/use-xo-role-privileges-collection.ts'
import { isSelectablePrivilegeResource } from '@/modules/role/utils/privilege-catalogue.util.ts'
import { getPrivilegeScopeType } from '@/modules/role/utils/privilege-scope.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { privilege } = defineProps<{
  privilege: FrontXoPrivilege
}>()

const { t } = useI18n()

const scopeTypeLabels = usePrivilegeScopeTypeLabels()

const scopeType = computed(() => getPrivilegeScopeType(privilege.selector))

const selectableResource = computed(() =>
  isSelectablePrivilegeResource(privilege.resource) ? privilege.resource : undefined
)

const appliedToIds = usePrivilegeAppliedToIds(() => privilege)

const appliedToObjects = usePrivilegeScopeObjectsByIds(selectableResource, () => appliedToIds.value ?? [])
</script>

<style lang="postcss" scoped>
.privilege-scope-card {
  .rows {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
