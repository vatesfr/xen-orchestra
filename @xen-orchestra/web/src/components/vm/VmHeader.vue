<template>
  <UiHeadBar>
    {{ vm.name_label }}
    <template #icon>
      <VtsObjectIcon size="medium" :state="vm.power_state.toLocaleLowerCase() as VmState" type="vm" />
    </template>
    <template #actions>
      <UiLink :href="xo5VmGeneralHref" size="medium">
        {{ t('manage-vm-lifecycle-in-xo-5') }}
      </UiLink>
      <MenuList placement="bottom-end">
        <template #trigger="{ open }">
          <UiDropdownButton @click="open($event)">{{ t('change-state') }}</UiDropdownButton>
        </template>
        <VtsVmActions :vm />
      </MenuList>
    </template>
  </UiHeadBar>
  <TabList>
    <RouterLink v-slot="{ isActive, href }" :to="`/vm/${vm.id}/dashboard`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('dashboard') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="`/vm/${vm.id}/console`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('console') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="`/vm/${vm.id}/backups`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('backups') }}
      </TabItem>
    </RouterLink>
    <TabItem>
      <UiLink :href="xo5VmStatsHref" size="medium">
        {{ t('stats') }}
      </UiLink>
    </TabItem>
    <RouterLink v-slot="{ isActive, href }" :to="`/vm/${vm.id}/system`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('system') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="`/vm/${vm.id}/networks`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('network') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="`/vm/${vm.id}/vdis`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('vdis') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/vm/[id]/tasks', params: { id: vm.id } }" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('tasks') }}
      </TabItem>
    </RouterLink>
  </TabList>
</template>

<script lang="ts" setup>
import { useXoRoutes } from '@/remote-resources/use-xo-routes.ts'
import type { VmState } from '@core/types/object-icon.type'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import type { XoVm } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import VtsVmActions from './actions/VtsVmActions.vue'

const { vm } = defineProps<{ vm: XoVm }>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()
const xo5VmGeneralHref = computed(() => buildXo5Route(`/vms/${vm.id}/general`))
const xo5VmStatsHref = computed(() => buildXo5Route(`/vms/${vm.id}/stats`))
</script>
