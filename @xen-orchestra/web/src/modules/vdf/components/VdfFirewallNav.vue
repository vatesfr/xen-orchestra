<template>
  <TabList class="vdf-firewall-nav">
    <RouterLink v-for="tab of tabs" :key="tab.label" v-slot="{ isActive, href }" :to="tab.to" custom>
      <UiTabItem :active="isActive" :href tag="a" class="tab">
        <VtsIcon :name="tab.icon" size="medium" />
        {{ tab.label }}
        <UiCounter
          v-if="tab.showChanges && changes.length > 0"
          v-tooltip="t('firewall:draft:changes', { n: changes.length })"
          :value="changes.length"
          accent="warning"
          variant="primary"
          size="small"
        />
      </UiTabItem>
    </RouterLink>
  </TabList>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useVdfPolicy } from '@/modules/vdf/composables/vdf-policy.composable.ts'
import type { IconName } from '@core/icons'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import TabList from '@core/components/tab-list/TabList.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiTabItem from '@core/components/ui/tab-item/UiTabItem.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const { changes } = useVdfPolicy(() => pool)

const tabs = computed<{ to: RouteLocationRaw; label: string; icon: IconName; showChanges?: boolean }[]>(() => {
  const params = { id: pool.id }

  return [
    { to: { name: '/pool/[id]/firewall/overview', params }, label: t('firewall:overview'), icon: 'fa:traffic-rule' },
    {
      to: { name: '/pool/[id]/firewall/policies', params },
      label: t('firewall:policies'),
      icon: 'fa:layer-group',
      showChanges: true,
    },
    { to: { name: '/pool/[id]/firewall/groups', params }, label: t('firewall:groups'), icon: 'fa:object-group' },
    { to: { name: '/pool/[id]/firewall/trace', params }, label: t('firewall:trace'), icon: 'fa:route' },
    { to: { name: '/pool/[id]/firewall/live', params }, label: t('firewall:live'), icon: 'fa:bars-progress' },
    { to: { name: '/pool/[id]/firewall/logs', params }, label: t('firewall:logs'), icon: 'fa:list' },
  ]
})
</script>

<style lang="postcss" scoped>
.vdf-firewall-nav {
  .tab {
    gap: 0.8rem;
  }
}
</style>
