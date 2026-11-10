<template>
  <UiHeadBar>
    {{ vm.name_label }}
    <template #icon>
      <VtsIcon :name="vmIcon" :tooltip="iconTooltip" size="medium" />
    </template>
    <template v-if="hasPendingOperation" #status>
      <UiLoader
        v-tooltip="{
          placement: 'top',
          content: currentOperation,
        }"
      />
    </template>
    <template #actions>
      <VmMainActions :vm show-xo5-link />
    </template>
  </UiHeadBar>
  <TabList>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/vm/[id]/dashboard', params: { id: vm.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('dashboard') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/vm/[id]/console', params: { id: vm.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('console') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/vm/[id]/backups', params: { id: vm.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('backups') }}
      </UiTabItem>
    </RouterLink>
    <UiTabItem>
      <UiLink :href="xo5VmStatsHref" size="medium">
        {{ t('stats') }}
      </UiLink>
    </UiTabItem>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/vm/[id]/system', params: { id: vm.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('system') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/vm/[id]/networks', params: { id: vm.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('network') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/vm/[id]/vdis', params: { id: vm.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('vdis') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: `/vm/[id]/snapshots`, params: { id: vm.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('snapshots') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/vm/[id]/tasks', params: { id: vm.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('tasks') }}
      </UiTabItem>
    </RouterLink>
  </TabList>
</template>

<script lang="ts" setup>
import VmMainActions from '@/modules/vm/components/actions/VmMainActions.vue'
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { getVmIcon } from '@/modules/vm/utils/xo-vm.util.ts'
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

const { vm } = defineProps<{ vm: FrontXoVm }>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()

const xo5VmStatsHref = computed(() => buildXo5Route(`/vms/${vm.id}/stats`))

const { hasPendingOperation, currentOperation, iconTooltip } = useXoVmUtils(() => vm)

const vmIcon = computed(() => getVmIcon(vm))
</script>
