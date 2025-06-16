<template>
  <UiHeadBar>
    <template #icon>
      <UiObjectIcon size="medium" type="host" :state="host.power_state.toLocaleLowerCase() as HostState" />
    </template>
    {{ host.name_label }}
    <template v-if="isMaster" #status>
      <VtsIcon v-tooltip="t('master')" accent="info" :icon="faCircle" :overlay-icon="faStar" />
    </template>
  </UiHeadBar>
  <TabList>
    <RouterLink v-slot="{ isActive, href }" :to="`/host/${host.id}/dashboard`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('dashboard') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="`/host/${host.id}/console`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('console') }}
      </TabItem>
    </RouterLink>
    <TabItem disabled>{{ t('alarms') }}</TabItem>
    <TabItem disabled>{{ t('stats') }}</TabItem>
    <RouterLink v-slot="{ isActive, href }" :to="`/host/${host.id}/system`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('system') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="`/host/${host.id}/networks`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('network') }}
      </TabItem>
    </RouterLink>
    <TabItem disabled>{{ t('storage') }}</TabItem>
    <TabItem disabled>{{ t('tasks') }}</TabItem>
    <RouterLink v-slot="{ isActive, href }" :to="`/host/${host.id}/vms`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('vms') }}
      </TabItem>
    </RouterLink>
  </TabList>
</template>

<script lang="ts" setup>
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import type { XoHost } from '@/types/xo/host.type'
import type { HostState } from '@core/types/object-icon.type'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faCircle, faStar } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XoHost
}>()

const { t } = useI18n()

const { isMasterHost } = useHostStore().subscribe()
const isMaster = computed(() => isMasterHost(host.id))
</script>
