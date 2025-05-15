<template>
  <VtsObjectNotFoundHero v-if="host === undefined" :id type="page" />
  <VtsColumns v-else>
    <VtsColumn>
      <HostSystemGeneralInformation :host />
      <HostSystemNetworking :host />
      <HostSystemResourceManagement :host />
    </VtsColumn>
    <VtsColumn>
      <!--    Todo: wait for the licenses availability -->
      <!--    <HostSystemLicensing /> -->
      <HostSystemSoftwareTooling :host />
      <HostSystemHardwareSpecifications :host />
    </VtsColumn>
  </VtsColumns>
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
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsObjectNotFoundHero from '@core/components/state-hero/VtsObjectNotFoundHero.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const id = computed(() => route.params.uuid as XenApiHost['uuid'])

const { getByUuid } = useHostStore().subscribe()

const host = computed(() => getByUuid(id.value))
</script>
