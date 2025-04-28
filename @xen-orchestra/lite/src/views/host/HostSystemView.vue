<template>
  <VtsObjectNotFoundHero v-if="host === undefined" :id type="page" />
  <div v-else class="host-system-view" :class="{ mobile: uiStore.isMobile }">
    <HostSystemGeneralInformation class="general" :host />
    <HostSystemNetworking class="networking" :host />
    <HostSystemResourceManagement class="resource" :host />
    <!--    Todo: wait for the licenses availability -->
    <!--    <HostSystemLicensing class="licensing" /> -->
    <HostSystemSoftwareTooling class="software" :host />
    <HostSystemHardwareSpecifications class="hardware" :host />
  </div>
</template>

<script lang="ts" setup>
import HostSystemGeneralInformation from '@/components/host/system/HostSystemGeneralInformation.vue'
import HostSystemHardwareSpecifications from '@/components/host/system/HostSystemHardwareSpecifications.vue'
// import HostSystemLicensing from '@/components/host/system/HostSystemLicensing.vue'
import HostSystemNetworking from '@/components/host/system/HostSystemNetworking.vue'
import HostSystemResourceManagement from '@/components/host/system/HostSystemResourceManagement.vue'
import HostSystemSoftwareTooling from '@/components/host/system/HostSystemSoftwareTooling.vue'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import VtsObjectNotFoundHero from '@core/components/state-hero/VtsObjectNotFoundHero.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const id = computed(() => route.params.uuid as XenApiHost['uuid'])

const { getByUuid } = useHostStore().subscribe()

const host = computed(() => getByUuid(id.value))

const uiStore = useUiStore()
</script>

<style lang="postcss" scoped>
.host-system-view {
  column-count: 2;
  column-gap: 0.8rem;
  margin: 0.8rem;
  & > * {
    break-inside: avoid;
    margin-bottom: 0.8rem;
  }
  &.mobile {
    column-count: 1;
  }
}
</style>
