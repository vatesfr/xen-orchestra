<template>
  <TabList class="vdf-firewall-nav">
    <RouterLink v-for="tab of tabs" :key="tab.label" v-slot="{ isActive, href }" :to="tab.to" custom>
      <UiTabItem :active="isActive || tab.also?.includes(route.name)" :href tag="a">
        {{ tab.label }}
      </UiTabItem>
    </RouterLink>
    <!-- tech preview (vdf#42) -->
    <VdfPreviewBadge class="preview" />
  </TabList>
</template>

<script lang="ts" setup>
import VdfPreviewBadge from '@/modules/vdf/components/VdfPreviewBadge.vue'
import type { VdfScope } from '@/modules/vdf/composables/vdf-scope.composable.ts'
import TabList from '@core/components/tab-list/TabList.vue'
import UiTabItem from '@core/components/ui/tab-item/UiTabItem.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { type RouteLocationRaw, useRoute } from 'vue-router'

const { scope } = defineProps<{
  scope: VdfScope
}>()

const { t } = useI18n()

const route = useRoute()

// The same tab bar as the object headers (PoolHeader): labels only. The
// count of unpublished changes is in the draft bar, under it.
// also: the pages under a tab (the monitor mode report, under Policies)
const tabs = computed<{ to: RouteLocationRaw; label: string; also?: string[] }[]>(() => {
  // traces, live view and logs are a pool's: the global configuration is
  // enforced there
  if (scope.kind === 'global') {
    return [
      { to: { name: '/(site)/firewall/overview' }, label: t('firewall:overview') },
      { to: { name: '/(site)/firewall/policies' }, label: t('firewall:policies') },
      { to: { name: '/(site)/firewall/groups' }, label: t('firewall:groups') },
      { to: { name: '/(site)/firewall/history' }, label: t('firewall:history') },
    ]
  }

  const params = { id: scope.pool.id }

  return [
    { to: { name: '/pool/[id]/firewall/overview', params }, label: t('firewall:overview') },
    {
      to: { name: '/pool/[id]/firewall/policies', params },
      label: t('firewall:policies'),
      also: ['/pool/[id]/firewall/monitor'],
    },
    { to: { name: '/pool/[id]/firewall/groups', params }, label: t('firewall:groups') },
    { to: { name: '/pool/[id]/firewall/trace', params }, label: t('firewall:trace') },
    { to: { name: '/pool/[id]/firewall/traffic', params }, label: t('firewall:traffic') },
    { to: { name: '/pool/[id]/firewall/history', params }, label: t('firewall:history') },
    { to: { name: '/pool/[id]/firewall/settings', params }, label: t('firewall:settings') },
  ]
})
</script>

<style lang="postcss" scoped>
.vdf-firewall-nav .preview {
  align-self: center;
  margin-inline: auto 1.6rem;
}
</style>
