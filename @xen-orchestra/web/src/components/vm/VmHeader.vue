<template>
  <UiHeadBar>
    {{ vm.name_label }}
    <template #icon>
      <VtsObjectIcon size="medium" :state="vm.power_state.toLocaleLowerCase() as VmState" type="vm" />
    </template>
    <template #actions>
      <UiLink :href="`/#/vms/${vm.id}/general`" size="medium">
        {{ t('manage-vm-lifecycle-in-xo-5') }}
      </UiLink>
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
      <UiLink :href="`/#/vms/${vm.id}/stats`" size="medium">
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
    <TabItem disabled>{{ t('storage') }}</TabItem>
    <TabItem disabled>{{ t('tasks') }}</TabItem>
  </TabList>
</template>

<script lang="ts" setup>
import type { XoVm } from '@/types/xo/vm.type'
import type { VmState } from '@core/types/object-icon.type'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useI18n } from 'vue-i18n'

defineProps<{ vm: XoVm }>()

const { t } = useI18n()
</script>
