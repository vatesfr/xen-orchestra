<template>
  <ul class="infra-host-list">
    <li v-if="hasError" class="text-error">
      {{ $t('error-no-data') }}
    </li>
    <li v-else-if="!isReady">{{ $t('loading-hosts') }}</li>
    <template v-else>
      <InfraHostItem v-for="host in hosts" :key="host.$ref" :host-opaque-ref="host.$ref" />
    </template>
  </ul>
</template>

<script lang="ts" setup>
import InfraHostItem from '@/components/infra/InfraHostItem.vue'
import { useHostCollection } from '@/stores/xen-api/host.store'
import { NAV_TAB, useNavigationStore } from '@/stores/navigation.store'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

const navigationStore = useNavigationStore()
const { currentNavigationTab } = storeToRefs(navigationStore)

const { records: hosts, isReady, hasError } = useHostCollection()

const hostsSorted = computed(() => hosts.value.sort((h1, h2) => {
  const name1 = h1.name_label.toLowerCase()
  const name2 = h2.name_label.toLowerCase()

  if (name1 < name2) {
    return -1
  } 
  if (name1 > name2) {
    return 1
  }
  return 0
})
)

</script>

<style lang="postcss" scoped>
.text-error {
  padding-left: 3rem;
  font-weight: 700;
  font-size: 16px;
  line-height: 150%;
  color: var(--color-red-vates-base);
}
</style>
