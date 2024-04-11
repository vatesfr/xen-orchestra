<template>
  <ul class="infra-host-list">
    <li v-if="hasError" class="text-error typo h6-semi-bold">
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
import { useHostStore } from '@/stores/xen-api/host.store'

const { records: hosts, isReady, hasError } = useHostStore().subscribe()
</script>

<style lang="postcss" scoped>
.text-error {
  padding-left: 3rem;
  color: var(--color-red-base);
}
</style>
