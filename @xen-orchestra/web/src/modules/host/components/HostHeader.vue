<template>
  <UiHeadBar>
    {{ host.name_label }}
    <template #icon>
      <VtsIcon :name="hostIcon" :tooltip="iconTooltip" size="medium" />
    </template>
    <template v-if="isChangingState || isMaster" #status>
      <UiLoader
        v-if="isChangingState"
        v-tooltip="{
          placement: 'top',
          content: currentOperation,
        }"
      />
      <VtsIcon v-if="isMaster" v-tooltip="t('master')" name="status:primary-circle" size="medium" />
    </template>
    <template #actions>
      <HostHeaderActions :host />
    </template>
  </UiHeadBar>
  <TabList :label="host.name_label">
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/host/[id]/dashboard', params: { id: host.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('dashboard') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/host/[id]/console', params: { id: host.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('console') }}
      </UiTabItem>
    </RouterLink>
    <UiTabItem>
      <UiLink :href="xo5HostStatsHref" size="medium">
        {{ t('stats') }}
      </UiLink>
    </UiTabItem>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/host/[id]/system', params: { id: host.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('system') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/host/[id]/networks', params: { id: host.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('network') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/host/[id]/storage', params: { id: host.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('storage') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/host/[id]/tasks', params: { id: host.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('tasks') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/host/[id]/vms', params: { id: host.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('vms') }}
      </UiTabItem>
    </RouterLink>
  </TabList>
</template>

<script lang="ts" setup>
import HostHeaderActions from '@/modules/host/components/actions/HostHeaderActions.vue'
import { useXoHostUtils } from '@/modules/host/composables/xo-host-utils.composable.ts'
import { type FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { getHostIcon } from '@/modules/host/utils/xo-host.util.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import TabList from '@core/components/tab-list/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import UiTabItem from '@core/components/ui/tab-item/UiTabItem.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const { isChangingState, currentOperation, iconTooltip } = useXoHostUtils(() => host)

const { buildXo5Route } = useXoRoutes()
const xo5HostStatsHref = computed(() => buildXo5Route(`/hosts/${host.id}/stats`))

const { isMasterHost } = useXoHostCollection()

const isMaster = computed(() => isMasterHost(host.id))
const hostIcon = computed(() => getHostIcon(host))
</script>
