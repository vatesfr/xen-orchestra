<template>
  <UiHeadBar>
    {{ host.name_label }}
    <template #icon>
      <VtsObjectIcon
        v-tooltip="{
          placement: 'top',
          content: currentOperation ? currentOperation : '',
        }"
        size="medium"
        type="host"
        :busy="isChangingState"
        :state="hostState"
      />
    </template>
    <template v-if="isMaster" #status>
      <VtsIcon v-tooltip="t('master')" name="status:primary-circle" size="medium" />
    </template>
    <template #actions>
      <UiLink size="medium" :to="{ name: '/vm/new', query: { poolid: host.$pool } }" icon="fa:plus">
        {{ t('new-vm') }}
      </UiLink>
      <MenuList v-if="!uiStore.isSmall" placement="bottom-end">
        <template #trigger="{ open }">
          <UiDropdownButton @click="open($event)">{{ t('action:change-state') }}</UiDropdownButton>
        </template>
        <HostPowerStateActions :host />
      </MenuList>

      <MenuList placement="bottom-end">
        <template #trigger="{ open }">
          <UiButtonIcon
            v-tooltip="{
              placement: 'left',
              content: t('more-actions'),
            }"
            icon="action:more-actions"
            accent="brand"
            size="medium"
            @click="open($event)"
          />
        </template>
        <HostMoreActions :host />
      </MenuList>
    </template>
  </UiHeadBar>
  <TabList>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/host/[id]/dashboard', params: { id: host.id } }" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('dashboard') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/host/[id]/console', params: { id: host.id } }" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('console') }}
      </TabItem>
    </RouterLink>
    <TabItem>
      <UiLink :href="xo5HostStatsHref" size="medium">
        {{ t('stats') }}
      </UiLink>
    </TabItem>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/host/[id]/system', params: { id: host.id } }" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('system') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/host/[id]/networks', params: { id: host.id } }" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('network') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/host/[id]/storage', params: { id: host.id } }" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('storage') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/host/[id]/tasks', params: { id: host.id } }" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('tasks') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/host/[id]/vms', params: { id: host.id } }" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('vms') }}
      </TabItem>
    </RouterLink>
  </TabList>
</template>

<script lang="ts" setup>
import HostPowerStateActions from '@/modules/host/components/actions/HostPowerStateActions.vue'
import HostMoreActions from '@/modules/host/components/HostMoreActions.vue'
import { useXoHostUtils } from '@/modules/host/composables/xo-host-utils.composable.ts'
import { type FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { getHostState } from '@/modules/host/utils/xo-host.util.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const uiStore = useUiStore()

const { isChangingState, currentOperation } = useXoHostUtils(() => host)

const { buildXo5Route } = useXoRoutes()
const xo5HostStatsHref = computed(() => buildXo5Route(`/hosts/${host.id}/stats`))

const { isMasterHost } = useXoHostCollection()

const isMaster = computed(() => isMasterHost(host.id))
const hostState = computed(() => getHostState(host))
</script>
