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
        <div class="rows">
          <VtsCardRowKeyValue>
            <template #key>{{ t('privilege') }}</template>
            <template #value>{{ privilege.id }}</template>
            <template #addons>
              <VtsCopyButton :value="privilege.id" />
            </template>
          </VtsCardRowKeyValue>
          <VtsCardRowKeyValue>
            <template #key>{{ t('privilege:resource') }}</template>
            <template #value>{{ privilege.resource }}</template>
            <template #addons>
              <VtsCopyButton :value="privilege.resource" />
            </template>
          </VtsCardRowKeyValue>
          <VtsCardRowKeyValue>
            <template #key>{{ t('privilege:selector') }}</template>
            <template #value>{{ privilege.selector }}</template>
            <template v-if="privilege.selector" #addons>
              <VtsCopyButton :value="privilege.selector" />
            </template>
          </VtsCardRowKeyValue>
          <VtsCardRowKeyValue>
            <template #key>{{ t('privilege:action') }}</template>
            <template #value>{{ privilege.action }}</template>
            <template #addons>
              <VtsCopyButton :value="privilege.action" />
            </template>
          </VtsCardRowKeyValue>
          <VtsCardRowKeyValue>
            <template #key>{{ t('privilege:effect') }}</template>
            <template #value>
              <UiTagsList>
                <UiTag :accent="EFFECT_ACCENTS[privilege.effect]" variant="secondary">
                  {{ t(privilege.effect) }}
                </UiTag>
              </UiTagsList>
            </template>
          </VtsCardRowKeyValue>
        </div>
      </div>
    </UiCollapsibleList>

    <VtsStateHero v-else type="no-data" format="card" horizontal size="extra-small">
      {{ t('no-privilege-attached') }}
    </VtsStateHero>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import {
  type FrontXoPrivilege,
  useXoRolePrivilegesCollection,
} from '@/modules/role/remote-resources/use-xo-role-privileges-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import UiTag, { type TagAccent } from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { useI18n } from 'vue-i18n'

const { role } = defineProps<{
  role: FrontXoRole
}>()

const { t } = useI18n()

const EFFECT_ACCENTS = {
  allow: 'success',
  deny: 'danger',
} as const satisfies Record<FrontXoPrivilege['effect'], TagAccent>

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

    .rows {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
  }
}
</style>
