<template>
  <UiHeadBar>
    <template #icon>
      <VtsObjectIcon size="medium" type="host" :state="toLower(host.power_state)" />
    </template>
    {{ host.name_label }}
    <template v-if="isMaster" #status>
      <VtsIcon v-tooltip="t('master')" name="status:primary-circle" size="medium" />
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
    <TabItem>
      <UiLink :href="xo5HostStatsHref" size="medium">
        {{ t('stats') }}
      </UiLink>
    </TabItem>
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
    <RouterLink v-slot="{ isActive, href }" :to="`/host/${host.id}/storage`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('storage') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/host/[id]/tasks', params: { id: host.id } }" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('tasks') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="`/host/${host.id}/vms`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('vms') }}
      </TabItem>
    </RouterLink>
  </TabList>
</template>

<script lang="ts" setup>
import { useXoHostCollection, type FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()
const xo5HostStatsHref = computed(() => buildXo5Route(`/hosts/${host.id}/stats`))

const { isMasterHost } = useXoHostCollection()

const isMaster = computed(() => isMasterHost(host.id))
</script>
